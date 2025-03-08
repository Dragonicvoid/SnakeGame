import { _decorator, Component, Node, UITransform, Vec2, CCBoolean } from 'cc';
import { ArenaManager } from './ArenaManager';
import { Coordinate, TileMapData } from '../interface/map';
import { ARENA_DEFAULT_OBJECT_SIZE, ARENA_DEFAULT_VALUE, ARENA_OBJECT_TYPE } from '../enum/arenaConfig';
import { convertToArenaPos, getGridIdxByCoord } from '../util/arenaConvert';
import { ObstacleSpriteRef } from '../interface/other';
import { GameplayCamera } from '../object/gameplayCamera';
const { ccclass, property } = _decorator;

@ccclass('ObstacleManager')
export class ObstacleManager extends Component {
  private readonly OUTSIDE_GRASS_OPACITY = 255;

  @property(Node)
  private readonly spike?: Node;

  @property(Node)
  private readonly obstacleParent?: Node;

  @property(Node)
  private readonly unusedObsParent?: Node;

  @property(GameplayCamera)
  private readonly gameplayCamera?: GameplayCamera;

  @property(ArenaManager)
  private readonly arenaManager?: ArenaManager;

  private obstacleMap = new Array<TileMapData[]>();

  private spikes = new Array<ObstacleSpriteRef>();

  //incrementally add grass
  private onGrassLoadProcess: boolean = false;
  private MAX_PROCESS_PER_FRAME = 20;
  private tilePosArr: Array<Coordinate> = [];

  start() {
    /**
     * Update sprite visibilities every SPRITE_UPDATE_VISIBILITY_INTERVAL
     *
     * If sprite is outside of camera, it will be returned to the pool
     *
     * TO-DO: experimental, previously this is called on every update() cycle
     * We try to use schedule instead to improve performance
     *
     * Do note this may cause unexpected culling if camera is moving very fast, so may need to adjust
     * interval / camera cull dimension properly
     */
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
        })
        const tileData: TileMapData = {
          type: ARENA_OBJECT_TYPE.NONE,
          playerIDList: [],
          x: x,
          y: y,
          gridX: x,
          gridY: y,
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


  private createSpikeInstance(coor: Coordinate) {
    const { obstacleParent } = this;
    if (!obstacleParent) return;
    const spikeUiTransform = this.spike?.getComponent(UITransform);
    if (!spikeUiTransform) return;
    const { width, height } = spikeUiTransform;
    this.setObstacleMapObject(coor.x, coor.y, ARENA_OBJECT_TYPE.SPIKE);
    const spike = {
      parent: obstacleParent,
      position: new Vec2(coor.x, coor.y),
      dimension: new Vec2(width, height),
      targetOpacity: 255,
    };
    this.spikes.push(spike);
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
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const idxX = Math.floor(x / TILE);
    const idxY = Math.floor(y / TILE);

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

  private returnObstacleSprite(
    spriteRef: ObstacleSpriteRef,
    _: ARENA_OBJECT_TYPE,
  ) {
    const { sprite } = spriteRef;

    if (sprite) {
      this.unusedObsParent.insertChild(sprite.node, 0);
      spriteRef.parent = undefined;
    }
  }

  public updateObstacleSpriteVisibility(
    spriteRef: ObstacleSpriteRef,
    obstacleType: ARENA_OBJECT_TYPE,
  ) {
    // check camera
    const { position, dimension } = spriteRef;

    const { x, y } = position;
    const { x: width, y: height } = dimension;

    const isInsideCamera = this.gameplayCamera?.isRectVisibleInCamera(
      x,
      y,
      width,
      height,
    );

    if (isInsideCamera) {
      this.spawnObstacleSprite(spriteRef, obstacleType);
    } else {
      this.returnObstacleSprite(spriteRef, obstacleType);
    }

    return -1;
  }

  onDestroy(): void {
    this.clearObstacle();
    this.tilePosArr = [];
  }
}
