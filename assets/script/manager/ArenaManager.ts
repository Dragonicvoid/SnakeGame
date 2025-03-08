import { _decorator, Component, Node, Vec2 } from "cc";
import { SnakeConfig } from "../interface/player";
import {
  ARENA_DEFAULT_OBJECT_SIZE,
  ARENA_DEFAULT_VALUE,
  ARENA_OBJECT_TYPE,
} from "../enum/arenaConfig";
import { GridConfig, SpikeConfig } from "../interface/gridConfig";
import { FoodConfig } from "../interface/food";
import { GridManager } from "./gridManager";
import { Coordinate } from "../interface/map";
import { convertPosToArenaPos, getGridIdxByCoord } from "../util/arenaConvert";
import { ObstacleManager } from "./obstacleManager";
import { PersistentDataManager } from "./persistentDataManager";
import { configMaps } from "../defaultValue/map";
const { ccclass, property } = _decorator;

@ccclass("ArenaManager")
export class ArenaManager extends Component {
  @property(GridManager)
  private gridManager: GridManager | null = null;

  @property(ObstacleManager)
  private obsManager: ObstacleManager | null = null;

  protected start(): void {
    this.initializedMap();
  }

  private initializedMap() {
    const mapIdx = PersistentDataManager.instance.selectedMap;
    const map = configMaps[mapIdx];

    for (let y = map.col - 1; y >= 0; y--) {
      for (let x = 0; x < map.row; x++) {
        const idx = y * map.row + x;
        this.handleTileByType(map.maps[idx], { x: x, y: map.col - 1 - y });
      }
    }
  }

  private handleTileByType(type: ARENA_OBJECT_TYPE, coor: Coordinate) {
    switch (type) {
      case ARENA_OBJECT_TYPE.SPIKE:
        this.obsManager?.createSpike(coor);
        break;
      case ARENA_OBJECT_TYPE.NONE:
      case ARENA_OBJECT_TYPE.FOOD:
      case ARENA_OBJECT_TYPE.WALL:
      case ARENA_OBJECT_TYPE.SNAKE:
      default:
        break;
    }
  }

  public findNearestObstacleTowardPoint(player: SnakeConfig, radius: number) {
    const playerHead = player.state.body[0];

    if (!playerHead) return null;

    const { x, y } = playerHead.position;
    const gridToCheck = this.getGridsToCheck({ x, y });
    const spikes: SpikeConfig[] = [];

    if (!gridToCheck) return null;

    gridToCheck.forEach((grid) => {
      spikes.push(...grid.spikes);
    });

    if (!spikes.length) return [];

    const duplicateAngleDetection: Array<number> = [];
    const detectedObstacleAngles: Array<number> = [];
    const { state } = player;

    const botHeadPos = state.body[0];

    for (let spike of spikes) {
      const detectObstacle = this.isCircleHitBox(
        botHeadPos.position.x,
        botHeadPos.position.y,
        spike.position.x,
        spike.position.y,
        radius,
        ARENA_DEFAULT_OBJECT_SIZE.TILE,
      );

      if (detectObstacle) {
        const obstacleAngle = Math.atan2(
          botHeadPos.position.y - spike.position.y,
          botHeadPos.position.x - spike.position.x,
        );
        if (duplicateAngleDetection.indexOf(obstacleAngle) === -1) {
          duplicateAngleDetection.push(obstacleAngle);
          const angleInDegree = (obstacleAngle * 180) / Math.PI;
          detectedObstacleAngles.push(angleInDegree);
        }
      }
    }

    return detectedObstacleAngles;
  }

  private isCircleHitBox(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    circleRadius: number,
    boxWidth: number,
  ) {
    const deltaX = Math.abs(x1 - x2);
    const deltaY = Math.abs(y1 - y2);

    if (deltaX > boxWidth / 2 + circleRadius) {
      return false;
    }
    if (deltaY > boxWidth / 2 + circleRadius) {
      return false;
    }

    if (deltaX <= boxWidth / 2) {
      return true;
    }
    if (deltaY <= boxWidth / 2) {
      return true;
    }

    const hitCorner =
      Math.pow(deltaX - boxWidth / 2, 2) + Math.pow(deltaY - boxWidth / 2, 2);

    return hitCorner <= Math.pow(circleRadius, 2);
  }

  public getGridWithMostFood(): GridConfig | undefined {
    let result: undefined | GridConfig = undefined;
    this.gridManager?.gridList.forEach((grid) => {
      if (!result || grid.foods.length > result.foods.length) {
        result = grid;
      }
    });
    return result;
  }

  public getNearestDetectedFood(
    player: SnakeConfig,
    radius: number,
  ): FoodConfig | null {
    let result: FoodConfig | null = null;

    const playerHead = player.state.body[0];

    if (!playerHead) return null;

    const { x, y } = playerHead.position;

    const gridToCheck = this.getGridsToCheck({ x, y });

    if (!gridToCheck) return null;

    let nearestLength = Number.MAX_VALUE;
    gridToCheck.forEach((grid) => {
      grid.foods.forEach((f) => {
        const distance = Vec2.distance(f.state.position, playerHead.position);
        if (!result || distance < nearestLength) {
          result = f;
          nearestLength = distance;
        }
      });
    });

    return result;
  }

  private getGridsToCheck(pos: Coordinate) {
    if (!this.gridManager?.isValid) return;

    const gridToCheck = new Set<GridConfig>();

    // check its surroundings
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const gridIdx = getGridIdxByCoord({
          x: pos.x + j * ARENA_DEFAULT_VALUE.GRID_WIDTH,
          y: pos.x + i * ARENA_DEFAULT_VALUE.GRID_HEIGHT,
        });

        if (gridIdx === undefined) continue;

        gridToCheck.add(this.gridManager.gridList[gridIdx]);
      }
    }

    return gridToCheck;
  }
}
