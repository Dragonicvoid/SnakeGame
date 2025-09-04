import { _decorator, Component, Node, Vec2 } from "cc";

import { AIDebugger } from "../aiDebugger/aiDebugger";
import { configMaps } from "../defaultValue/map";
import {
  ARENA_DEFAULT_OBJECT_SIZE,
  ARENA_DEFAULT_VALUE,
  ARENA_OBJECT_TYPE,
} from "../enum/arenaConfig";
import { FoodConfig } from "../interface/food";
import { GridConfig, SpikeConfig } from "../interface/gridConfig";
import { Coordinate, TileMapData } from "../interface/map";
import { SnakeConfig } from "../interface/player";
import {
  convertArenaPosToCoord,
  convertCoorToArenaPos,
  getGridIdxByPos as getGridIdxByArenaPos,
} from "../util/arenaConvert";
import { GridManager } from "./gridManager";
import { ObstacleManager } from "./obstacleManager";
import { PersistentDataManager } from "./persistentDataManager";

const { ccclass, property } = _decorator;

@ccclass("ArenaManager")
export class ArenaManager extends Component {
  @property(GridManager)
  private gridManager: GridManager | null = null;

  @property(ObstacleManager)
  private obsManager: ObstacleManager | null = null;

  @property(AIDebugger)
  private aiDebugger: AIDebugger | null = null;

  public mapData: TileMapData[][] = [[]];

  public spawnPos: Vec2[] = [];

  public centerPos: Vec2 = new Vec2();

  protected onLoad(): void {
    this.initializedMap();
  }

  public initializedMap() {
    const mapIdx = PersistentDataManager.instance.selectedMap;
    const map = configMaps[mapIdx];
    this.spawnPos = [];
    this.centerPos = convertCoorToArenaPos(
      Math.floor(map.row / 2),
      Math.floor(map.col / 2),
    );
    this.mapData = [[]];
    this.gridManager?.setup();
    this.obsManager?.clearObstacle();
    this.obsManager?.initializeObstacleMap();

    for (let y = map.col - 1; y >= 0; y--) {
      this.mapData[y] = new Array(map.row);
      let str = "";
      for (let x = 0; x < map.row; x++) {
        const posX =
          x * ARENA_DEFAULT_OBJECT_SIZE.TILE - ARENA_DEFAULT_VALUE.WIDTH / 2;
        const posY =
          y * ARENA_DEFAULT_OBJECT_SIZE.TILE - ARENA_DEFAULT_VALUE.HEIGHT / 2;
        const gridIdx = getGridIdxByArenaPos({
          x: posX,
          y: posY,
        });
        this.mapData[y][x] = {
          x: posX,
          y: posY,
          gridIdx: gridIdx,
          type: ARENA_OBJECT_TYPE.NONE,
          playerIDList: [],
        };
        const idx = y * map.row + x;
        this.handleTileByType(map.maps[idx], { x: x, y: y });
        str += map.maps[idx] + ",";
      }
    }

    this.aiDebugger?.setMapToDebug(this.mapData);
  }

  private handleTileByType(type: ARENA_OBJECT_TYPE, coor: Coordinate) {
    switch (type) {
      case ARENA_OBJECT_TYPE.SPIKE:
        this.obsManager?.createSpike(coor);
        break;
      case ARENA_OBJECT_TYPE.NONE:
        break;
      case ARENA_OBJECT_TYPE.FOOD:
        break;
      case ARENA_OBJECT_TYPE.WALL:
        break;
      case ARENA_OBJECT_TYPE.SNAKE:
        break;
      case ARENA_OBJECT_TYPE.SPAWN_POINT:
        const pos = convertCoorToArenaPos(coor.x, coor.y);
        this.spawnPos.push(pos);
        break;
      default:
        break;
    }
    this.updateTileType(coor, type);
  }

  public updateTileType(coord: Coordinate, type: ARENA_OBJECT_TYPE) {
    if (
      this.mapData &&
      this.mapData[coord.y] &&
      this.mapData[coord.y][coord.x]
    ) {
      this.mapData[coord.y][coord.x].type = type;
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
      spikes.push(...(grid?.spikes ?? []));
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
      grid?.foods.forEach((f) => {
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

    const gridToCheck = new Set<GridConfig | undefined>();

    // check its surroundings
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const gridIdx = getGridIdxByArenaPos({
          x: pos.x + j * ARENA_DEFAULT_VALUE.GRID_WIDTH,
          y: pos.y + i * ARENA_DEFAULT_VALUE.GRID_HEIGHT,
        });

        if (gridIdx === undefined) continue;

        gridToCheck.add(this.gridManager.gridList[gridIdx]);
      }
    }

    return gridToCheck;
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

  public setMapBody(pos: Coordinate, playerId: string) {
    if (!this.mapData) return;

    const coord = convertArenaPosToCoord(pos.x, pos.y);

    if (!this.mapData[coord.y] || !this.mapData[coord.y][coord.x]) return;

    this.mapData[coord.y][coord.x].playerIDList.push(playerId);
  }

  public removePlayerMapBody(player: SnakeConfig) {
    player.state.body.forEach((part) => {
      this.removeMapBody(part.position, player.id);
    });
  }

  public removeMapBody(pos: Coordinate, playerId: string) {
    if (!this.mapData) return;

    const coord = convertArenaPosToCoord(pos.x, pos.y);

    if (!this.mapData[coord.y] || !this.mapData[coord.y][coord.x]) return;

    this.mapData[coord.y][coord.x].playerIDList = this.mapData[coord.y][
      coord.x
    ].playerIDList.filter((id) => {
      return id !== playerId;
    });
  }
}
