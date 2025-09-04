import { _decorator, math, Vec2 } from 'cc';

import { ACTION_SCORE } from '../enum/actionScore';
import { ARENA_DEFAULT_OBJECT_SIZE } from '../enum/arenaConfig';
import { BOT_ACTION } from '../enum/botAction';
import { BOT_CONFIG } from '../enum/botConfig';
import { PlannerFactor } from '../interface/ai';
import { SnakeActionData, SnakeConfig } from '../interface/player';
import { getDistance } from '../util/aStar';
import { BaseAction } from './baseAction';

const { ccclass, property } = _decorator;

@ccclass("GoToPlayerAction")
export class GoToPlayerAction extends BaseAction {
  protected cooldown = 2;

  protected forceRun = 0;

  public startTime = 0;

  private aggresiveDuration = 0;

  private forceToChangePath = 2;

  private aggresiveStartTStamp = 0;

  private aggresiveEndsTStamp = 0;

  private hasEnterPlayerCone = false;

  private headingLeft = false;

  private firstTime = true;

  public isAggresive = false;

  public mapKey = BOT_ACTION.CHASE_PLAYER;

  constructor() {
    super();
    this.startTime = performance.now();
  }

  public run(player: SnakeConfig, data: SnakeActionData): void {
    this.player = player;
    this.currData = data;

    const { manager } = data;
    if (!manager) return;
    const { arenaManager, playerManager } = manager;

    if (!arenaManager?.isValid || !playerManager?.isValid) return;

    let newDir: Vec2 | undefined = new Vec2(0, 0);

    const mainPlayer: SnakeConfig | undefined = playerManager.getMainPlayer();

    if (!mainPlayer) return;

    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const frontRay = mainPlayer.state.movementDir;
    const currHeadPos = player.state.body[0].position;
    const mainPlayerHead = mainPlayer.state.body[0].position;

    if (getDistance(mainPlayerHead, currHeadPos) < TILE * 5) {
      // Be more accurate if near target
      this.resetPathData();
    } else {
      this.headingLeft = this.isLeft(
        frontRay,
        new Vec2(
          currHeadPos.x - mainPlayerHead.x,
          currHeadPos.y - mainPlayerHead.y
        )
      );
    }

    const maxVelo =
      Math.abs(frontRay.x) > Math.abs(frontRay.y)
        ? Math.abs(frontRay.x)
        : Math.abs(frontRay.y);
    const vecX = [frontRay.x / maxVelo, frontRay.y / maxVelo, 0];
    const vecY = [0, 0, -1];
    const leftVec = this.crossProd(vecX, vecY);
    const rightVec = this.crossProd(vecY, vecX);

    const normLeft = this.normalize(leftVec);
    const normRight = this.normalize(rightVec);
    const normFront = this.normalize([frontRay.x, frontRay.y, 0]);

    const leftSideHead = {
      x: mainPlayerHead.x + normLeft[0] * TILE * 2,
      y: mainPlayerHead.y + normLeft[1] * TILE * 2,
    };
    const rightSideHead = {
      x: mainPlayerHead.x + normRight[0] * TILE * 2,
      y: mainPlayerHead.y + normRight[1] * TILE * 2,
    };

    let mainPlayerSide = {
      x: normFront[0] * TILE * 2,
      y: normFront[1] * TILE * 2,
    };

    const frontPlayerSide = {
      x: mainPlayerHead.x + normFront[0] * TILE * 4,
      y: mainPlayerHead.y + normFront[1] * TILE * 4,
    };

    let otherPlayerSide = {
      x: normFront[0] * TILE * 4,
      y: normFront[1] * TILE * 4,
    };
    if (this.headingLeft) {
      mainPlayerSide.x += leftSideHead.x;
      mainPlayerSide.y += leftSideHead.y;

      otherPlayerSide.x += rightSideHead.x;
      otherPlayerSide.y += rightSideHead.y;
    } else {
      mainPlayerSide.x += rightSideHead.x;
      mainPlayerSide.y += rightSideHead.y;

      otherPlayerSide.x += leftSideHead.x;
      otherPlayerSide.y += leftSideHead.y;
    }

    const targetCoord = {
      x: mainPlayerSide.x,
      y: mainPlayerSide.y,
    };

    const path = this.getPath(this.player.state.body[0].position, targetCoord, [
      mainPlayerSide,
      frontPlayerSide,
      otherPlayerSide,
    ]);

    if (!path || path.result.length <= 0) return;

    newDir = this.processBotMovementByTarget(this.player, path.result[0]);

    if (!newDir) return;

    this.updateDirection(newDir);
  }

  public updateScore(factor: PlannerFactor): number {
    this.score = ACTION_SCORE.GO_TO_PLAYER_DEFAULT;
    const { player, playerList } = factor;

    if (!player || !playerList) return this.score;

    if (this.firstTime) {
      this.cooldown = BOT_CONFIG.AGGRESSIVE_COOLDOWN;
      this.aggresiveDuration = BOT_CONFIG.AGGRRESIVE_TIME;
      this.firstTime = false;
      this.aggresiveEndsTStamp = this.cooldown > 0 ? this.cooldown * -1000 : 0;
    }

    const mainPlayer = playerList.find((p) => {
      return !p.isBot;
    });

    if (!mainPlayer) return this.score;

    const inPlayerCone = this.isInPlayerAggresiveCone(mainPlayer, player);

    // Check if its the first time enemy enter zone
    // if yes randomize attack chance
    if (inPlayerCone && !this.hasEnterPlayerCone && !this.isAggresive) {
      this.hasEnterPlayerCone = true;
    } else if (!inPlayerCone && this.hasEnterPlayerCone) {
      this.hasEnterPlayerCone = false;
    }

    // needs to be check before cone check to diferrentiate bot normal
    // and on aggressive cooldown
    if (!this.isValidToBeAggresive(playerList, player)) return this.score;

    if (!inPlayerCone && !this.isAggresive) return this.score;

    const currentTStamp = performance.now();
    const deltaTStamp = currentTStamp - this.aggresiveStartTStamp;
    // lose aggresion after duration
    if (this.isAggresive && deltaTStamp / 1000 > this.aggresiveDuration) {
      this.isAggresive = false;
      this.aggresiveEndsTStamp = currentTStamp;
      return this.score;
    }

    this.score += ACTION_SCORE.BECOME_AGGRESIVE;

    if (deltaTStamp / 1000 < this.forceToChangePath) {
      return this.score;
    }

    // becoming aggresive
    if (!this.isAggresive) {
      this.aggresiveStartTStamp = currentTStamp;
    }
    this.isAggresive = true;
    this.resetPathData();

    return this.score;
  }

  private crossProd(a: number[], b: number[]) {
    if (a.length !== 3 || b.length !== 3) return [0, 0, 0];

    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  private normalize(vec: number[]) {
    const magtitute = this.magV3(vec);

    if (magtitute > 0) {
      return [vec[0] / magtitute, vec[1] / magtitute, vec[2] / magtitute];
    }

    return vec;
  }

  private isLeft(targetVec: Vec2, currVec: Vec2) {
    return -targetVec.x * currVec.y + targetVec.y * currVec.x < 0;
  }

  protected isValidToBeAggresive(
    playerList: SnakeConfig[],
    currPlayer: SnakeConfig,
    currTime?: number
  ) {
    if (typeof currTime !== "number") {
      currTime = performance.now();
    }

    for (let i = 0; i < playerList.length; i++) {
      const player = playerList[i];

      if (!player?.isBot || !player.isAlive) continue;

      const goToPlayerAct = player.possibleActions?.get(
        BOT_ACTION.CHASE_PLAYER
      );

      if (
        goToPlayerAct instanceof GoToPlayerAction &&
        goToPlayerAct?.isAggresive
      ) {
        if (currPlayer.id === player.id) {
          return true;
        }
      }
    }

    const deltaTStamp = currTime - this.aggresiveEndsTStamp;
    if (deltaTStamp / 1000 < this.cooldown && !this.isAggresive) {
      this.score += ACTION_SCORE.AGGRESIVE_ON_COOLDOWN;
      return false;
    }

    return true;
  }

  public onChange(): void {
    this.resetPathData();
  }
}
