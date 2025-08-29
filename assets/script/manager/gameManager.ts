import { _decorator, Component, Node, Vec2, Vec3 } from 'cc';

import { BaseAction } from '../action/baseAction';
import { BOT_CONFIG } from '../enum/botConfig';
import { ASSET_LOAD_EVENT } from '../enum/event';
import { PlannerFactor } from '../interface/ai';
import { FoodConfig } from '../interface/food';
import { SnakeConfig } from '../interface/player';
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

  @property(BotPlanner)
  private planner: BotPlanner | null = null;

  private botInterval: number = 0;

  public startGame() {
    this.uiManager?.showStartUI(false);
    const centerPos = this.arenaManager?.centerPos ?? new Vec2(0, 0);

    const playerPos = this.arenaManager?.spawnPos.pop() ?? new Vec2(0, 0);
    const playerDir = new Vec2(1, 0);
    if (playerPos > centerPos) {
      playerDir.set(-1, 0);
    }
    this.playerManager?.createPlayer(playerPos, playerDir);

    const enemyPos = this.arenaManager?.spawnPos.pop() ?? new Vec2(0, 0);
    const enemyDir = new Vec2(1, 0);
    if (enemyPos > centerPos) {
      enemyDir.set(-1, 0);
    }
    this.playerManager?.createPlayer(enemyPos, enemyDir, true);

    this.foodManager?.startSpawningFood();

    // this.schedule(() => {
    //   this.playerManager?.playerList.forEach((snake) => {
    //     this.handleBotLogic(snake);
    //   });
    // });
  }

  private handleBotLogic(snake: SnakeConfig, skipTurnRadius = false) {
    if (!skipTurnRadius) return;

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
    if (snake.state.inDirectionChange === true && !skipTurnRadius) return;
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
      // player.serverPlayerData.botData = {
      //   targetFood: undefined,
      // };
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
  }
}
