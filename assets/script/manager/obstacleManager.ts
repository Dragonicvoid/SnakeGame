import { _decorator, CCBoolean, Component, instantiate, Node, UITransform, Vec2 } from 'cc';

import {
    ARENA_DEFAULT_OBJECT_SIZE, ARENA_DEFAULT_VALUE, ARENA_OBJECT_TYPE
} from '../enum/arenaConfig';
import { Coordinate, TileMapData } from '../interface/map';
import { ObstacleSpriteRef } from '../interface/other';
import { GameplayCamera } from '../object/gameplayCamera';
import {
    convertArenaPosToCoord, convertCoorToArenaPos, convertPosToArenaPos, getGridIdxByCoord
} from '../util/arenaConvert';

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

  private obstacleMap = new Array<TileMapData[]>();

  private spikes = new Array<ObstacleSpriteRef>();

  onLoad() {
    this.clearObstacle();
    this.initializeObstacleMap();
  }

  public initializeObstacleMap() {
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const cols = ARENA_DEFAULT_VALUE.WIDTH / TILE;
    const rows = ARENA_DEFAULT_VALUE.HEIGHT / TILE;

    for (let y = 0; y < rows; y++) {
      const colData: TileMapData[] = [];
      for (let x = 0; x < cols; x++) {
        const gridPos = getGridIdxByCoord({
          x: x * TILE,
          y: y * TILE,
        });
        const tileData: TileMapData = {
          type: ARENA_OBJECT_TYPE.NONE,
          playerIDList: [],
          x: x,
          y: y,
          gridIdx: gridPos,
        };
        colData.push(tileData);
      }
      this.obstacleMap.push(colData);
    }
  }

  public clearObstacle() {
    this.obstacleMap = [];
    this.spikes = [];
  }

  public createSpike(coor: Coordinate) {
    const { obstacleParent } = this;
    if (!obstacleParent) return;
    const spikeUiTransform = this.spike?.getComponent(UITransform);
    if (!spikeUiTransform) return;
    const { width, height } = spikeUiTransform;
    this.setObstacleMapObject(coor.x, coor.y, ARENA_OBJECT_TYPE.SPIKE);
    const spike = {
      parent: obstacleParent,
      position: convertCoorToArenaPos(coor.x, coor.y),
      dimension: new Vec2(width, height),
      targetOpacity: 255,
    };
    this.spikes.push(spike);
    this.instantiateSpike(coor);
  }

  public instantiateSpike(coor: Coordinate) {
    if (!this.spike?.isValid) return;

    const newSpike = instantiate(this.spike);
    this.obstacleParent?.addChild(newSpike);

    const pos = convertCoorToArenaPos(coor.x, coor.y);
    newSpike.setPosition(pos.x, pos.y);
    newSpike.active = true;
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

    this.obstacleMap[idxX][idxY].type = type;
  }

  public getObstacleList(obstacleType: ARENA_OBJECT_TYPE) {
    switch (obstacleType) {
      case ARENA_OBJECT_TYPE.SPIKE:
        return this.spikes;
      default:
        return this.spikes;
    }
  }

  private spawnObstacleSprite(
    spriteRef: ObstacleSpriteRef,
    obstacleType: ARENA_OBJECT_TYPE,
  ) {
    const isSpriteAlreadySpawned = spriteRef.sprite;

    if (isSpriteAlreadySpawned) return;

    const obstacle = this.getObstacleList(obstacleType);
    if (!obstacle) return;

    const sprite = spriteRef.sprite;
    const { position } = spriteRef;
    if (this.obstacleParent && sprite) {
      // only insert to parent when sprite doesn't have parent yet
      this.obstacleParent.insertChild(sprite.node, 0);
      sprite.node.setPosition(position.x, position.y);
      sprite.node.active = true;
      spriteRef.parent = this.obstacleParent;
    }
  }

  public isPosSafeForSpawn(coord: Coordinate) {
    return (
      (this.obstacleMap[coord.x][coord.y].type &
        (ARENA_OBJECT_TYPE.SPIKE | ARENA_OBJECT_TYPE.WALL)) ===
      0
    );
  }

  onDestroy(): void {
    this.clearObstacle();
  }
}
