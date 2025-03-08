import { _decorator, Component, misc, Vec2 } from 'cc';
import { AStar, AStarSearchData, getDistance } from '../util/aStar';
import { SnakeActionData, SnakeConfig } from '../interface/player';
import { FoodConfig, FoodState } from '../interface/food';
import { Coordinate } from '../interface/map';
import { BOT_CONFIG } from '../enum/botConfig';
import { BOT_ACTION } from '../enum/botAction';
import { Movement } from '../interface/gameplay';
import { PlannerFactor } from '../interface/ai';
const { ccclass, property } = _decorator;

@ccclass('BaseAction')
export class BaseAction extends Component {
  protected cooldown = 0;

  protected forceRun = 0;

  protected lastActionTStamp: number = 0;

  protected player: SnakeConfig | null = null;

  protected currData: SnakeActionData | null = null;

  private aStar: AStar | null = null;

  public prevPathfindingData: AStarSearchData | undefined = undefined;

  public path: Array<Coordinate> = [];

  public score: number = 0;

  public mapKey: string = BOT_ACTION.NORMAL;

  private readonly playerConeDegree = BOT_CONFIG.AGGRESSIVE_CONE_RAD;

  private readonly playerMinDist = BOT_CONFIG.AGGRESSIVE_CONE_DIST;

  private readonly maxOpenList = 700;

  private readonly maxCloseList = 300;

  constructor() {
    super();
    this.aStar = new AStar();
  }

  public init() {}

  public onChange() {}

  public run(player: SnakeConfig, data: SnakeActionData) {}

  public updateScore(factor: PlannerFactor) {
    return 0;
  }

  public processBotMovementByTarget(
    player: SnakeConfig,
    target: Coordinate,
  ) {
    const headCood = player.state.body[0].position;
    const dirTowardTarget = Math.atan2(
      headCood.y - target.y,
      headCood.x - target.x,
    );
    const targetVec = {
      x: -Math.cos(dirTowardTarget),
      y: Math.sin(2 * Math.PI - dirTowardTarget),
    };
    return new Vec2(targetVec.x, targetVec.y);
  }

  public processBotMovementByFood(
    player: SnakeConfig,
    targetFood: FoodConfig,
  ) {
    const headCood = player.state.body[0].position;
    const foodPos = targetFood.state.position;
    const dirTowardFood = Math.atan2(
      headCood.y - foodPos.y,
      headCood.x - foodPos.x,
    );
    const targetVec = {
      x: -Math.cos(dirTowardFood),
      y: Math.sin(2 * Math.PI - dirTowardFood),
    };
    return targetVec;
  }

  public processBotMovementByFatalObs(
    _: SnakeConfig,
    detectedObstacle: Array<number>,
  ) {
    if (detectedObstacle.length > 0) {
      let turnAngle: number;
      if (detectedObstacle.length === 1) {
        turnAngle = detectedObstacle[0] + 135;
      } else {
        let angleOne = detectedObstacle[detectedObstacle.length - 1];
        let angleTwo = detectedObstacle[0];
        let highestAngleDifference = 360 - Math.abs(angleTwo - angleOne);
        for (let i = 1; i < detectedObstacle.length; i++) {
          const angleDiff = Math.abs(
            detectedObstacle[i] - detectedObstacle[i - 1],
          );
          if (angleDiff > highestAngleDifference) {
            angleOne = detectedObstacle[i - 1];
            highestAngleDifference = angleDiff;
          }
        }
        turnAngle = highestAngleDifference / 2 + angleOne;
      }
      if (turnAngle > 360) {
        turnAngle -= 360;
      }
      const turnAngleInRad = (turnAngle * Math.PI) / 180;
      const targetVec = {
        x: -Math.cos(turnAngleInRad),
        y: Math.sin(2 * Math.PI - turnAngleInRad),
      };
      return targetVec;
    }
  }

  protected turnRadiusModification(
    newMovement: Movement,
    turnRadius: number,
    coorDir?: Coordinate,
  ) {
    if (!this.currData) return;

    const { manager } = this.currData;
    if (!manager) return;
    const { playerManager } = manager;

    coorDir = coorDir
      ? coorDir
      : playerManager?.getPlayerDirection(newMovement.player_id);
    if (!coorDir) return;

    //TURN RADIUS config range 0 - 5, transform to degrees = 30 - 180
    const turnRadians = misc.degreesToRadians(turnRadius * 30 + 30);
    const currDir = new Vec2(coorDir.x, coorDir.y);
    const newDir = new Vec2(newMovement.vector.x, newMovement.vector.y);
    const orientation = getOrientationBetweenVector(currDir, newDir);
    const angle = Vec2.angle(currDir, newDir);
    if (Math.abs(angle) < turnRadians) return newDir;
    const turnAngle = turnRadians * orientation;
    currDir.rotate(turnAngle);
    return currDir;
  }

  protected updateDirection(botNewDir: Coordinate) {
    if (!this.player || !this.currData) return;

    const player = this.player;
    const { manager } = this.currData;
    if (!manager) return;
    const { playerManager } = manager;

    if (!playerManager?.isValid) return;

    let newDir = player.movementDirection.vector;
    let currDir = playerManager.getPlayerDirection(player.id);

    newDir = new Vec2(
      Math.ceil(botNewDir.x * 100),
      Math.ceil(botNewDir.y * 100)
    );

    if (newDir) {
      this.player.movementDirection.vector = new Vec2(
        newDir.x,
        newDir.y,
    );
    }

    const targetDir = {
      x: newDir.x,
      y: newDir.y,
    };
    const dirArray = [];
    for (
      let limit = 0;
      newDir &&
      currDir?.x !== targetDir.x &&
      currDir?.y !== targetDir.y &&
      limit < 6;
      limit++
    ) {
      if (!playerManager) return;
      newDir = this.turnRadiusModification(
        {
          player_id: player.id,
          vector: new Vec2(targetDir.x, targetDir.y),
        } as Movement,
        BOT_CONFIG.TURN_RADIUS,
        currDir,
      );
      if (!newDir) return;
      currDir = {
        x: newDir.x,
        y: newDir.y,
      };
      dirArray.push(newDir);
    }
    if (dirArray.length <= 0) return;

    dirArray.forEach((item, idx) => {
      const schedule = idx * 0.064;
      this.scheduleOnce(() => {
        playerManager.handleMovement(player.id, {
          direction: {
            x: item.x,
            y: item.y,
          },
        });
        if (idx >= dirArray.length - 1) {
        }
      }, schedule);
    });
  }

  protected getFoodById(id: number) {
    if (!this.currData) return undefined;
    const { manager } = this.currData;
    if (!manager) return undefined;
    const { foodManager } = manager;
    const food = foodManager?.getFoodById(id) ?? null;

    return food;
  }

  protected getPath(
    curr: Coordinate,
    target: Coordinate,
    predefinedPath: Coordinate[] = [],
  ) {
    if (!this.aStar || !this.currData?.manager?.arenaManager?.mapData)
      return null;

    if (!this.prevPathfindingData) {
      this.prevPathfindingData = {
        openList: [],
        closeList: [],
        memoiPoint: new Map(),
        pathFound: null,
      };
    }

    this.aStar.setMap(this.currData.manager.arenaManager.mapData);
    const path = this.aStar.search(
      curr,
      target,
      this.prevPathfindingData,
      this.player?.id || '',
      predefinedPath,
    );

    this.path = path.result;

    // optimization
    if (
      this.prevPathfindingData.closeList.length > this.maxCloseList ||
      this.prevPathfindingData.openList.length > this.maxOpenList
    ) {
      this.resetPathData();
    }

    return path;
  }

  protected isInPlayerAggresiveCone(
    targetPlayer: SnakeConfig,
    currPlayer: SnakeConfig,
  ) {
    const mainPlayerCoord = targetPlayer.state.body[0].position;
    const currPlayerCoord = currPlayer.state.body[0].position;

    const currPlayerVec = {
      x: currPlayerCoord.x - mainPlayerCoord.x,
      y: currPlayerCoord.y - mainPlayerCoord.y,
    };
    const mainPlayerVec = {
      x: targetPlayer.state.velocity?.x ?? 0,
      y: targetPlayer.state.velocity?.y ?? 0,
    };

    const angle =
      (Math.acos(
        (currPlayerVec.x * mainPlayerVec.x +
          currPlayerVec.y * mainPlayerVec.y) /
          (this.mag(mainPlayerVec) * this.mag(currPlayerVec)),
      ) *
        180) /
      Math.PI;

    if (
      getDistance(currPlayerCoord, mainPlayerCoord) <= this.playerMinDist &&
      angle <= this.playerConeDegree / 2
    )
      return true;

    return false;
  }

  protected resetPathData() {
    this.path = [];
    this.prevPathfindingData = undefined;
  }

  public mag(coord: Coordinate) {
    return Math.sqrt(coord.x * coord.x + coord.y * coord.y);
  }

  public magV3(coord: number[]) {
    if (coord.length !== 3) {
      return 0;
    }
    return Math.sqrt(
      coord[0] * coord[0] + coord[1] * coord[1] + coord[2] * coord[2],
    );
  }

  public allowToChange() {
    const deltaTime = (performance.now() - this.lastActionTStamp) / 1000;
    return deltaTime >= this.forceRun;
  }
}
