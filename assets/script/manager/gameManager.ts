import {
    _decorator, Collider2D, Component, Contact2DType, director, EPhysics2DDrawFlags, game, math,
    Node, PhysicsGroup, PhysicsGroup2D, PhysicsSystem2D, RigidBody2D, Vec2, Vec3
} from 'cc';

import { BaseAction } from '../action/baseAction';
import { BOT_CONFIG } from '../enum/botConfig';
import { DIFFICULTY } from '../enum/difficulty';
import { GAME_EVENT } from '../enum/event';
import { PHYSICS_GROUP } from '../enum/physics';
import { PlannerFactor } from '../interface/ai';
import { FoodConfig } from '../interface/food';
import { GameOverData } from '../interface/gameOver';
import { SnakeConfig } from '../interface/player';
import { ArenaInput } from '../object/arenaInput';
import { BotPlanner } from '../util/botPlanner';
import { ArenaManager } from './ArenaManager';
import { FoodManager } from './foodManager';
import { GridManager } from './gridManager';
import { PersistentDataManager } from './persistentDataManager';
import { PlayerManager } from './playerManager';
import { UIManager } from './uiManager';

const { ccclass, property } = _decorator;

@ccclass("GameManager")
export class GameManager extends Component {
  @property(ArenaManager)
  private arenaManager: ArenaManager | null = null;

  @property(GridManager)
  private gridManager: GridManager | null = null;

  @property(PlayerManager)
  private playerManager: PlayerManager | null = null;

  @property(FoodManager)
  private foodManager: FoodManager | null = null;

  @property(UIManager)
  private uiManager: UIManager | null = null;

  @property(ArenaInput)
  private inputField: ArenaInput | null = null;

  @property(BotPlanner)
  private planner: BotPlanner | null = null;

  private botInterval: number = 0;

  private gameStartTime = 0;

  private diff: DIFFICULTY = DIFFICULTY.NORMAL;

  private headCollideCb = (
    selfCollider: Collider2D,
    otherCollider: Collider2D
  ) => {};

  private foodCollideCb = (
    selfCollider: Collider2D,
    otherCollider: Collider2D
  ) => {};

  private gameOverCb = (data: GameOverData) => {};

  private gameUpdateCb = () => {};

  public startGame() {
    this.arenaManager?.initializedMap();
    this.gameStartTime = game.totalTime;
    this.uiManager?.showStartUI(false);
    this.inputField?.startInputListener();

    this.createPlayer();
    this.setCollisionEvent();
    this.setGameEvent();

    this.gameUpdateCb = () => {
      const deltaTime = Math.min(1 / 60, game.deltaTime);
      this.playerManager?.playerList.forEach((snake) => {
        this.handleBotLogic(snake);
        this.playerManager?.updateCoordinate(deltaTime);
      });
    };
    this.schedule(this.gameUpdateCb);
  }

  private createPlayer() {
    const centerPos = this.arenaManager?.centerPos ?? new Vec2(0, 0);

    const rand = Math.random();
    const playerPos =
      this.arenaManager?.spawnPos[rand > 0.5 ? 0 : 1] ?? new Vec2(0, 0);
    const playerDir = new Vec2(1, 0);
    if (playerPos > centerPos) {
      playerDir.set(-1, 0);
    }
    this.playerManager?.createPlayer(playerPos, playerDir);

    const enemyPos =
      this.arenaManager?.spawnPos[rand > 0.5 ? 1 : 0] ?? new Vec2(0, 0);
    const enemyDir = new Vec2(1, 0);
    if (enemyPos > centerPos) {
      enemyDir.set(-1, 0);
    }
    this.playerManager?.createPlayer(enemyPos, enemyDir, true);

    this.foodManager?.startSpawningFood();
  }

  private stopGame() {
    this.foodManager?.stopSpawningFood();
    this.inputField?.stopInputListener();
    this.unschedule(this.gameUpdateCb);
    this.stopCollisionEvent();
  }

  public goToMainMenu() {
    this.foodManager?.removeAllFood();
    this.playerManager?.removeAllPlayers();
    this.foodManager?.removeAllFood();
    this.uiManager?.showStartUI();
    this.uiManager?.showEndUI(undefined, false);
  }

  private setCollisionEvent() {
    this.headCollideCb = this.onHeadCollide.bind(this);
    this.foodCollideCb = this.onFoodCollide.bind(this);
    PhysicsSystem2D.instance.on(
      Contact2DType.BEGIN_CONTACT,
      this.headCollideCb
    );

    PhysicsSystem2D.instance.on(
      Contact2DType.BEGIN_CONTACT,
      this.foodCollideCb
    );
  }

  private setGameEvent() {
    this.gameOverCb = this.onGameOver.bind(this);
    PersistentDataManager.instance.eventTarget.once(
      GAME_EVENT.GAME_OVER,
      this.gameOverCb
    );
  }

  private stopCollisionEvent() {
    PhysicsSystem2D.instance.off(
      Contact2DType.BEGIN_CONTACT,
      this.headCollideCb
    );

    PhysicsSystem2D.instance.off(
      Contact2DType.BEGIN_CONTACT,
      this.foodCollideCb
    );
  }

  private onHeadCollide(selfCollider: Collider2D, otherCollider: Collider2D) {
    const gameOverData: GameOverData = {
      player: this.playerManager?.getMainPlayer(),
      enemy: this.playerManager?.getEnemy(),
      time: game.totalTime,
      diff: this.diff,
      isWon: false,
    };

    if (
      (selfCollider.group === PHYSICS_GROUP.PLAYER &&
        otherCollider.group === PHYSICS_GROUP.ENEMY) ||
      (selfCollider.group === PHYSICS_GROUP.ENEMY &&
        otherCollider.group === PHYSICS_GROUP.PLAYER)
    ) {
      PersistentDataManager.instance.eventTarget.emit(
        GAME_EVENT.GAME_OVER,
        gameOverData
      );
    }

    if (
      (selfCollider.group === PHYSICS_GROUP.PLAYER &&
        otherCollider.group === PHYSICS_GROUP.OBSTACLE) ||
      (selfCollider.group === PHYSICS_GROUP.OBSTACLE &&
        otherCollider.group === PHYSICS_GROUP.PLAYER) ||
      (selfCollider.group === PHYSICS_GROUP.ENEMY_BODIES &&
        otherCollider.group === PHYSICS_GROUP.PLAYER) ||
      (selfCollider.group === PHYSICS_GROUP.PLAYER &&
        otherCollider.group === PHYSICS_GROUP.ENEMY_BODIES)
    ) {
      PersistentDataManager.instance.eventTarget.emit(
        GAME_EVENT.GAME_OVER,
        gameOverData
      );
    }

    if (
      (selfCollider.group === PHYSICS_GROUP.ENEMY &&
        otherCollider.group === PHYSICS_GROUP.OBSTACLE) ||
      (selfCollider.group === PHYSICS_GROUP.OBSTACLE &&
        otherCollider.group === PHYSICS_GROUP.ENEMY) ||
      (selfCollider.group === PHYSICS_GROUP.PLAYER_BODIES &&
        otherCollider.group === PHYSICS_GROUP.ENEMY) ||
      (selfCollider.group === PHYSICS_GROUP.ENEMY &&
        otherCollider.group === PHYSICS_GROUP.PLAYER_BODIES)
    ) {
      gameOverData.isWon = true;
      PersistentDataManager.instance.eventTarget.emit(
        GAME_EVENT.GAME_OVER,
        gameOverData
      );
    }
  }

  private onFoodCollide(selfCollider: Collider2D, otherCollider: Collider2D) {
    if (
      (selfCollider.group === PHYSICS_GROUP.FOOD_GRABBER &&
        otherCollider.group === PHYSICS_GROUP.FOOD) ||
      (selfCollider.group === PHYSICS_GROUP.FOOD &&
        otherCollider.group === PHYSICS_GROUP.FOOD_GRABBER)
    ) {
      const selfNodeParent = selfCollider.node.parent;
      const otherNodeParent = otherCollider.node.parent;

      if (selfNodeParent && otherNodeParent) {
        const food =
          this.foodManager?.getFoodByObj(selfNodeParent) ??
          this.foodManager?.getFoodByObj(otherNodeParent);
        const snake =
          this.playerManager?.getPlayerByFoodGrabber(selfNodeParent) ??
          this.playerManager?.getPlayerByFoodGrabber(otherNodeParent);

        if (snake && food && !food.state.eaten)
          this.foodManager?.processEatenFood(snake, food);
      }
    }
  }

  private onGameOver(data: GameOverData) {
    this.stopGame();
    this.uiManager?.showEndUI(data);
  }

  private handleBotLogic(snake: SnakeConfig) {
    if (!snake.isBot) return;

    if (
      !this.playerManager?.isValid ||
      !this.arenaManager?.isValid ||
      !this.foodManager?.isValid ||
      !this.planner
    )
      return;

    let detectedPlayer: Array<number> = [];
    let detectedWall: Array<number> = [];
    let detectedFood: FoodConfig | undefined;
    //handle bot Booster Activation
    // this.processBotBoosterUsage(player);

    //if bot in the middle of turning sequene, disable the turn logic
    if (snake.state.inDirectionChange === true) return;
    //detect player and food
    detectedPlayer = this.playerManager.findNearestPlayerTowardPoint(
      snake,
      BOT_CONFIG.TRIGGER_AREA_DST
    );

    detectedWall =
      this.arenaManager.findNearestObstacleTowardPoint(
        snake,
        BOT_CONFIG.TRIGGER_AREA_DST
      ) ?? [];

    // need to updated to adjust botData
    let targetFood = snake.state.targetFood;
    if (detectedPlayer.length < 1 && !targetFood) {
      detectedFood =
        this.arenaManager.getNearestDetectedFood(
          snake,
          BOT_CONFIG.TRIGGER_AREA_DST
        ) ?? undefined;
    }

    if (detectedFood) {
      targetFood = {
        food: detectedFood,
        timeTargeted: Date.now(),
      };
    }

    if (targetFood) {
      const targetExist = this.foodManager.foodList.find(
        (item) => item.id === targetFood.food.id
      );
      const targetIsEaten = targetFood.food.state.eaten;
      const isExpired = Date.now() - targetFood.timeTargeted > 3000;
      snake.state.targetFood = targetFood;
      if (!targetExist || targetIsEaten || isExpired) {
        snake.state.targetFood = undefined;
      }
    }

    const currState = snake.state.body[0];

    const gridWithMostFood = this.arenaManager?.getGridWithMostFood();

    const factor: PlannerFactor = {
      detectedPlayer: detectedPlayer,
      detectedWall: detectedWall,
      detectedFood: detectedFood,
      currCoord: currState.position,
      gridWithMostFood: gridWithMostFood,
      listOfAvailableGrid: this.gridManager?.gridList ?? [],
      playerList: this.playerManager.playerList,
      player: snake,
    };
    const possibleActions: BaseAction[] = [];
    snake.possibleActions?.forEach((action) => {
      possibleActions.push(action);
    });
    const currAction = this.planner.plan(possibleActions, factor);

    const differentAction = currAction !== snake.action;
    if (currAction && snake.action?.allowToChange()) {
      if (differentAction) {
        snake.action?.onChange();
      }

      snake.action = currAction;

      if (differentAction) {
        currAction.init();
      }
    }

    snake.action?.run(snake, {
      manager: {
        arenaManager: this.arenaManager,
        foodManager: this.foodManager,
        playerManager: this.playerManager,
      },
      detectedFood: detectedFood,
      detectedPlayer: detectedPlayer,
      detectedWall: detectedWall,
    });

    snake.state.debugData = {
      actionName: snake.action?.mapKey,
      enemyID: snake.id,
      enemyPath: snake.action?.path,
      pathfindingState: snake.action?.prevPathfindingData,
      possibleActions: possibleActions,
    };
  }
}
