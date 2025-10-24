import {
  _decorator,
  CCBoolean,
  Component,
  instantiate,
  Node,
  UITransform,
  Vec2,
} from "cc";

import {
  ARENA_DEFAULT_OBJECT_SIZE,
  ARENA_DEFAULT_VALUE,
  ARENA_OBJECT_TYPE,
} from "../enum/arenaConfig";
import { Coordinate, TileMapData } from "../interface/map";
import { ObstacleData } from "../interface/other";
import { GameplayCamera } from "../object/gameplayCamera";
import { convertCoorToArenaPos, getGridIdxByPos } from "../util/arenaConvert";
import { GridManager } from "./gridManager";

const { ccclass, property } = _decorator;

@ccclass("ObstacleManager")
export class ObstacleManager extends Component {
  private readonly OUTSIDE_GRASS_OPACITY = 255;

  @property(Node)
  private readonly spike?: Node;

  @property(Node)
  private readonly obstacleParent?: Node;

  @property(GameplayCamera)
  private readonly gameplayCamera?: GameplayCamera;

  @property(GridManager)
  private gridManager: GridManager | null = null;

  private obstacleMap = new Array<TileMapData[]>();

  private spikes = new Array<ObstacleData>();

  onLoad() {
    this.clearObstacle();
    this.initializeObstacleMap();
  }

  public initializeObstacleMap() {
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const rows = Math.floor(ARENA_DEFAULT_VALUE.WIDTH / TILE);
    const cols = Math.floor(ARENA_DEFAULT_VALUE.HEIGHT / TILE);
    this.obstacleMap = [[]];

    for (let y = cols - 1; y >= 0; y--) {
      this.obstacleMap[y] = new Array(rows);
      for (let x = 0; x < rows; x++) {
        const pos = convertCoorToArenaPos(x, y);
        const gridPos = getGridIdxByPos({
          x: pos.x,
          y: pos.y,
        });
        const tileData: TileMapData = {
          type: ARENA_OBJECT_TYPE.NONE,
          playerIDList: [],
          x: pos.x,
          y: pos.y,
          gridIdx: gridPos,
        };
        this.obstacleMap[y][x] = tileData;
      }
    }
  }

  public clearObstacle() {
    this.spikes.forEach((s) => {
      s.obj?.destroy();
    });
    this.spikes = [];

    this.obstacleMap = [[]];
  }

  public createSpike(coor: Coordinate) {
    const { obstacleParent } = this;
    if (!obstacleParent) return;
    const spikeUiTransform = this.spike?.getComponent(UITransform);
    if (!spikeUiTransform) return;
    const { width, height } = spikeUiTransform;
    this.setObstacleMapObject(coor.x, coor.y, ARENA_OBJECT_TYPE.SPIKE);
    const pos = convertCoorToArenaPos(coor.x, coor.y);
    const gridPos = getGridIdxByPos({
      x: pos.x,
      y: pos.y,
    });
    this.gridManager?.addSpike({
      gridIndex: gridPos ?? 0,
      position: pos,
    });
    const spike: ObstacleData = {
      parent: obstacleParent,
      position: pos,
      dimension: new Vec2(width, height),
      targetOpacity: 255,
    };
    const obj = this.instantiateSpike(coor);
    spike.obj = obj;
    this.spikes.push(spike);
  }

  public instantiateSpike(coor: Coordinate) {
    if (!this.spike?.isValid) return;

    const newSpike = instantiate(this.spike);
    this.obstacleParent?.addChild(newSpike);

    const pos = convertCoorToArenaPos(coor.x, coor.y);
    newSpike.setPosition(pos.x, pos.y);
    newSpike.active = true;

    return newSpike;
  }

  private getObstacleMapObjectType(x: number, y: number): ARENA_OBJECT_TYPE {
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const idxX = Math.floor(x / TILE);
    const idxY = Math.floor(y / TILE);

    const column = this.obstacleMap[idxX];

    // If column does not exist, return NONE as default
    if (!column) {
      return ARENA_OBJECT_TYPE.NONE;
    }

    const cell = column[idxY];
    // If cell does not exist, return NONE as default
    if (!cell) {
      return ARENA_OBJECT_TYPE.NONE;
    }

    return cell.type ?? ARENA_OBJECT_TYPE.NONE;
  }

  private setObstacleMapObject(
    x: number,
    y: number,
    type: ARENA_OBJECT_TYPE,
    id?: number,
  ) {
    const idxX = Math.floor(x);
    const idxY = Math.floor(y);

    this.obstacleMap[idxY][idxX].type = type;
  }

  public getObstacleList(obstacleType: ARENA_OBJECT_TYPE) {
    switch (obstacleType) {
      case ARENA_OBJECT_TYPE.SPIKE:
        return this.spikes;
      default:
        return this.spikes;
    }
  }

  public isPosSafeForSpawn(coord: Coordinate) {
    let safe = 0;
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        safe |=
          this.obstacleMap[coord.y + y]?.[coord.x + x]?.type &
          (ARENA_OBJECT_TYPE.SPIKE | ARENA_OBJECT_TYPE.WALL);
      }
    }
    return safe === 0;
  }

  onDestroy(): void {
    this.clearObstacle();
  }
}
