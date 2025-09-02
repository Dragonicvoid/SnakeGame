import {
    _decorator, clamp, Collider2D, Component, game, instantiate, Material, Node, Prefab,
    RigidBody2D, Sprite, tween, Tween, Vec2, Vec3
} from 'cc';

import { GoToFood } from '../action/goToFood';
import { GoToPlayerAction } from '../action/goToPlayer';
import { NormalAction } from '../action/normalAction';
import { SnakeRenderable } from '../customRenderable2D/snakeRenderable';
import { ARENA_DEFAULT_OBJECT_SIZE } from '../enum/arenaConfig';
import { BOT_ACTION } from '../enum/botAction';
import { GAME_EVENT, INPUT_EVENT } from '../enum/event';
import { PHYSICS_GROUP } from '../enum/physics';
import { SNAKE_CONFIG } from '../enum/snakeConfig';
import { SnakeType } from '../enum/snakeType';
import { Coordinate } from '../interface/map';
import { SnakeBody, SnakeConfig, SnakeState } from '../interface/player';
import { SkinSelect } from '../object/skinSelect';
import { getStringCoordName } from '../util/aStar';
import { ArenaManager } from './ArenaManager';
import { PersistentDataManager } from './persistentDataManager';

const { ccclass, property } = _decorator;

@ccclass("PlayerManager")
export class PlayerManager extends Component {
  @property(ArenaManager)
  private arenaManager: ArenaManager | null = null;

  @property(SnakeRenderable)
  private playerRender: SnakeRenderable | null = null;

  @property(SnakeRenderable)
  private enemyRender: SnakeRenderable | null = null;

  @property(Sprite)
  private playerDisplay: Sprite | null = null;

  @property(Sprite)
  private enemyDisplay: Sprite | null = null;

  @property(SkinSelect)
  private skinSelect: SkinSelect | null = null;

  @property(Node)
  private collParent: Node | null = null;

  @property(Node)
  private sBodyPref: Node | null = null;

  @property(Node)
  private sFoodGrabPref: Node | null = null;

  private touchMoveCb = (delta: Vec2) => {};

  private increaseSizeCb = (player: SnakeConfig) => {};

  public playerList: SnakeConfig[] = [];

  private PLAYER_ID = "MAIN_PLAYER";

  private ENEMY_ID = "ENEMY";

  private eatAnim: Map<string, Tween | null> = new Map();

  onLoad() {
    this.touchMoveCb = this.onTouchMove.bind(this);
    this.increaseSizeCb = this.onSizeIncrease.bind(this);
    PersistentDataManager.instance.eventTarget.on(
      INPUT_EVENT.MOVE_TOUCH,
      this.touchMoveCb
    );

    PersistentDataManager.instance.eventTarget.on(
      GAME_EVENT.PLAYER_INCREASE_SIZE,
      this.increaseSizeCb
    );
  }

  public createPlayer(pos: Vec2, moveDir: Vec2, isBot = false) {
    if (!this.sBodyPref?.isValid || !this.sFoodGrabPref?.isValid) return;

    const totalBodies = Math.floor(4);

    const bodies: SnakeBody[] = [];
    let prevBodies: SnakeBody | null = null;
    let foodPos = { x: pos.x, y: pos.y };

    for (let i = 0; i < totalBodies; i++) {
      const newBody = this.createBody(isBot, i === 0, pos);

      if (!newBody) continue;

      if (!prevBodies) {
        bodies.push(newBody);
        newBody.obj?.setPosition(newBody.position.x, newBody.position.y);
        foodPos = this.getFoodGrabberPosition(newBody);
        prevBodies = newBody;
      } else {
        bodies.push(newBody);
        newBody.obj?.setPosition(newBody.position.x, newBody.position.y);
        prevBodies = newBody;
      }
    }

    const foodGrabObj = instantiate(this.sFoodGrabPref);
    foodGrabObj.setParent(this.collParent);

    const state: SnakeState = {
      foodGrabber: {
        position: new Vec2(foodPos.x, foodPos.y),
        radius: ARENA_DEFAULT_OBJECT_SIZE.FOOD_GRABBER,
        obj: foodGrabObj,
      },
      body: bodies,
      movementDir: moveDir,
      inputDirection: new Vec2(),
      speed: 5,
      coordName: "",
      inDirectionChange: false,
    };

    const skinData = isBot
      ? this.skinSelect?.getEnemySkinData()
      : this.skinSelect?.getPlayerSkinData();

    const player: SnakeConfig = {
      id: isBot ? this.ENEMY_ID : this.PLAYER_ID,
      state: state,
      isBot: isBot,
      isAlive: true,
      render: isBot ? this.enemyRender : this.playerRender,
      action: new NormalAction(),
      possibleActions: isBot
        ? new Map([
            [BOT_ACTION.NORMAL, new NormalAction()],
            [BOT_ACTION.CHASE_PLAYER, new GoToPlayerAction()],
            [BOT_ACTION.EAT, new GoToFood()],
          ])
        : undefined,
    };

    this.playerList.push(player);

    if (isBot) {
      if (!this.enemyRender?.isValid) return;

      this.enemyRender.snakeType = skinData?.type ?? SnakeType.NORMAL;
      this.enemyRender.skinData = skinData?.skin ?? null;
      this.enemyRender?.setSnakeBody(bodies);
    } else {
      if (!this.playerRender?.isValid) return;

      this.playerRender.snakeType = skinData?.type ?? SnakeType.NORMAL;
      this.playerRender.skinData = skinData?.skin ?? null;
      this.playerRender?.setSnakeBody(bodies);
    }

    this.handleMovement(player.id, {
      direction: moveDir,
      initialMovement: true,
    });
  }

  public removeAllPlayers() {
    this.playerList.forEach((player) => {
      player.state.foodGrabber.obj?.destroy();
      player.state.body.forEach((b) => {
        b.obj?.destroy();
      });
      player.state.body = [];
    });

    this.playerList = [];
    this.enemyRender?.setSnakeBody([]);
    this.playerRender?.setSnakeBody([]);
  }

  public findNearestPlayerTowardPoint(
    currentPlayer: SnakeConfig,
    radius: number
  ) {
    const duplicateAngleDetection: Array<number> = [];
    const detectedObstacleAngles: Array<number> = [];
    const { state } = currentPlayer;

    const botHeadPos = state.body[0];

    this.playerList.forEach((otherPlayer) => {
      if (otherPlayer.id === currentPlayer.id) return;

      const idxLen = otherPlayer.state.body.length;
      for (let i = 1; i < idxLen; i++) {
        const detectOtherPlayer = this.isCircleOverlap(
          botHeadPos.position.x,
          botHeadPos.position.y,
          otherPlayer.state.body[i].position.x,
          otherPlayer.state.body[i].position.y,
          radius,
          SNAKE_CONFIG.RADIUS
        );

        if (detectOtherPlayer) {
          const obstacleAngle = Math.atan2(
            botHeadPos.position.y - otherPlayer.state.body[i].position.y,
            botHeadPos.position.x - otherPlayer.state.body[i].position.x
          );
          if (duplicateAngleDetection.indexOf(obstacleAngle) === -1) {
            duplicateAngleDetection.push(obstacleAngle);
            const angleInDegree = (obstacleAngle * 180) / Math.PI;
            detectedObstacleAngles.push(angleInDegree);
          }
        }
      }
    });
    return detectedObstacleAngles;
  }

  private createBody(
    isBot: boolean,
    isHead: boolean,
    pos: Vec2
  ): SnakeBody | undefined {
    if (!this.sBodyPref?.isValid) return undefined;

    const bodyObj = instantiate(this.sBodyPref);
    bodyObj.setPosition(new Vec3(pos.x, pos.y));
    bodyObj.active = true;
    let group = isBot
      ? PHYSICS_GROUP.ENEMY_BODIES
      : PHYSICS_GROUP.PLAYER_BODIES;
    if (isHead) {
      group = isBot ? PHYSICS_GROUP.ENEMY : PHYSICS_GROUP.PLAYER;
    }
    const rigidbody = bodyObj.getComponentInChildren(RigidBody2D);
    if (rigidbody?.isValid) {
      rigidbody.group = group;
    }
    const collider = bodyObj.getComponentInChildren(Collider2D);
    if (collider?.isValid) {
      collider.group = group;
    }
    bodyObj.setParent(this.collParent);

    let newPos = pos.clone();

    const newBody = {
      position: newPos,
      radius: ARENA_DEFAULT_OBJECT_SIZE.SNAKE,
      movementQueue: [],
      velocity: new Vec2(0, 0),
      obj: bodyObj,
    };

    return newBody;
  }

  private isCircleOverlap(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r1: number,
    r2: number
  ) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.pow(deltaX, 2) + Math.pow(deltaY, 2) <= Math.pow(r1 + r2, 2);
  }

  public getPlayerDirection(id: string) {
    let dir = new Vec2();
    let player = this.playerList.find((otherPlayer) => {
      return otherPlayer.id === id;
    });

    if (player) {
      dir = player.state.movementDir;
    }

    return dir;
  }

  handleMovement(
    playerId: string,
    option?: {
      direction?: Vec2;
      speed?: number;
      initialMovement?: boolean;
    }
  ) {
    if (option?.speed === -1) return;
    const player = this.playerList.find((x) => x.id === playerId);
    if (!player) return;
    const pState = player.state;
    const physicBody = pState.body;
    const movDir = pState.movementDir;
    if (!physicBody) return;

    if (option) {
      if (option.direction) {
        const normalized = new Vec2(0, 0);
        Vec2.normalize(normalized, option.direction);

        movDir.x = normalized.x * pState.speed;
        movDir.y = normalized.y * pState.speed;
      }
    }
    if (!pState.inputDirection) pState.inputDirection = new Vec2();
    pState.inputDirection.x = movDir.x;
    pState.inputDirection.y = movDir.y;

    const velocity = new Vec2(movDir.x, movDir.y);

    if (option?.initialMovement) {
      physicBody[0].velocity = new Vec2(velocity);
      if (player.isBot && option.direction)
        pState.movementDir = option.direction;
    } else {
      physicBody[0].velocity = new Vec2(velocity);

      if (
        physicBody[1] &&
        (physicBody[1].velocity.x != 0 || physicBody[1].velocity.y != 0)
      ) {
        for (let i = 1; i < physicBody.length; i++) {
          physicBody[1].velocity = new Vec2(0, 0);
        }
      }
    }
  }

  // defaulted to 60 fps
  updateCoordinate(delta = 0.016) {
    for (let i = 0; i < this.playerList.length; i++) {
      const snake = this.playerList[i];
      const snakeState = snake.state;
      let headX = 0;
      let headY = 0;

      for (let ii = 0; ii < snakeState.body.length; ii++) {
        const bodyState = snakeState.body[ii];
        const tempheadX = bodyState.position.x;
        const tempheadY = bodyState.position.y;
        const prevPos: Coordinate = {
          x: tempheadX,
          y: tempheadY,
        };
        let finalPos: Coordinate = {
          x: 0,
          y: 0,
        };

        if (bodyState) {
          if (ii !== 0) {
            let dist = Vec2.distance(
              bodyState.position,
              new Vec2(headX, headY)
            );

            if (dist > ARENA_DEFAULT_OBJECT_SIZE.SNAKE) {
              let queueState = { x: headX, y: headY };
              do {
                queueState = bodyState.movementQueue.shift() ?? {
                  x: headX,
                  y: headY,
                };
                dist = Vec2.distance(
                  new Vec2(headX, headY),
                  new Vec2(queueState.x, queueState.y)
                );
              } while (dist > ARENA_DEFAULT_OBJECT_SIZE.SNAKE);

              bodyState.obj?.setPosition(
                queueState?.x ?? 0,
                queueState?.y ?? 0
              );
            }

            const coordName = getStringCoordName({
              x: bodyState.obj?.x ?? headX,
              y: bodyState.obj?.y ?? headY,
            });
            snakeState.coordName = coordName;
            bodyState.movementQueue.push({
              x: headX,
              y: headY,
            });
          }

          if (ii === 0) {
            const headPos = bodyState.position;

            const snakeDir = new Vec2(bodyState.velocity);
            const newDir = snakeDir.multiply(
              new Vec2(
                ARENA_DEFAULT_OBJECT_SIZE.TILE * delta,
                ARENA_DEFAULT_OBJECT_SIZE.TILE * delta
              )
            );
            bodyState.obj?.setPosition(
              headPos.x + newDir.x,
              headPos.y + newDir.y
            );
            const foodGrabberPos = this.getFoodGrabberPosition(bodyState);

            snakeState.foodGrabber.obj?.setPosition(
              foodGrabberPos.x,
              foodGrabberPos.y
            );
            snakeState.foodGrabber.position.set(
              foodGrabberPos.x,
              foodGrabberPos.y
            );
          }

          finalPos = bodyState.obj?.position ?? new Vec2(0, 0);
          bodyState.position.set(finalPos?.x ?? 0, finalPos?.y ?? 0);

          this.arenaManager?.removeMapBody(prevPos ?? { x: 0, y: 0 }, snake.id);
          this.arenaManager?.setMapBody(finalPos || { x: 0, y: 0 }, snake.id);
        }
        headX = tempheadX;
        headY = tempheadY;
      }
    }
  }

  private onTouchMove(delta: Vec2) {
    this.handleMovement(this.PLAYER_ID, {
      direction: delta,
    });
  }

  private onSizeIncrease(snake: SnakeConfig) {
    const length = snake.state.body.length;
    const lastBody = snake.state.body[length - 1];
    const pos = lastBody.obj?.position;
    const newBody = this.createBody(
      snake.isBot,
      false,
      new Vec2(pos?.x, pos?.y)
    );

    if (!newBody) return;

    snake.state.body.push(newBody);

    let anim = this.eatAnim.get(snake.id);
    const obj = { val: 0 };
    const tw = tween(obj).to(
      0.2,
      { val: 1 },
      {
        onUpdate: () => {
          let mat: Material | undefined = undefined;
          if (snake.isBot) {
            mat = this.enemyDisplay?.customMaterial ?? undefined;
          } else {
            mat = this.playerDisplay?.customMaterial ?? undefined;
          }
          const ratio = 1 - Math.abs(2 * obj.val - 1);
          mat?.setProperty("eatRatio", ratio);
        },
        onComplete: () => {
          let mat: Material | undefined = undefined;
          if (snake.isBot) {
            mat = this.enemyDisplay?.customMaterial ?? undefined;
          } else {
            mat = this.playerDisplay?.customMaterial ?? undefined;
          }
          mat?.setProperty("eatRatio", 0);
        },
      }
    );

    if (anim) anim.stop();

    anim = tw;
    anim.start();
  }

  private getFoodGrabberPosition(head: SnakeBody) {
    const norm = new Vec2(0, 0);
    Vec2.normalize(norm, head.velocity);
    const x = norm.x * head.radius + head.position.x;
    const y = norm.y * head.radius + head.position.y;

    return { x: x, y: y };
  }

  public getMainPlayer() {
    return this.getPlayerById(this.PLAYER_ID);
  }

  public getEnemy() {
    return this.getPlayerById(this.ENEMY_ID);
  }

  public getPlayerById(id: string) {
    return this.playerList.find((item) => item.id === id);
  }

  public getPlayerByBody(node: Node) {
    return this.playerList.find((item) =>
      item.state.body.find((body) => body.obj === node)
    );
  }

  public getPlayerByFoodGrabber(node: Node) {
    return this.playerList.find((item) => item.state.foodGrabber.obj === node);
  }
}
