import { _decorator, Component, game, math, Vec2 } from 'cc';
import { FoodConfig } from '../interface/food';
import { GridConfig, SpikeConfig } from '../interface/gridConfig';
import { ARENA_DEFAULT_OBJECT_SIZE, ARENA_DEFAULT_VALUE, ARENA_OBJECT_TYPE } from '../enum/arenaConfig';
import { FoodManager } from './foodManager';
import { Coordinate } from '../interface/map';
import { VISIBILITY_UPDATE_INTERVAL } from '../enum/other';
import { getGridIdxByCoord } from '../util/arenaConvert';
import { ObstacleManager } from './obstacleManager';
import { ObstacleSpriteRef } from '../interface/other';
import { GameplayCamera } from '../object/gameplayCamera';
const { ccclass, property } = _decorator;

@ccclass('GridManager')
export class GridManager extends Component {
  @property(ObstacleManager)
  public readonly obstacleManager?: ObstacleManager;

  @property(GameplayCamera)
  public readonly gameplayCamera?: GameplayCamera;

  @property(FoodManager)
  public readonly foodManager?: FoodManager;

  public gridList: GridConfig[] = [];

  private GRID_WIDTH = ARENA_DEFAULT_VALUE.GRID_WIDTH;
  private GRID_HEIGHT = ARENA_DEFAULT_VALUE.GRID_HEIGHT;

  public setup(arenaWidth: number, arenaHeight: number) {
    const { GRID_WIDTH, GRID_HEIGHT } = this;

    const maxCol = Math.ceil(arenaWidth / GRID_WIDTH);
    const maxRow = Math.ceil(arenaHeight / GRID_HEIGHT);
    this.gridList = [];

    for (let i = 0; i < maxRow; i++) {
      for (let j = 0; j < maxCol; j++) {
        const grid: GridConfig = {
          x1: j * GRID_WIDTH,
          x2: j * GRID_WIDTH + GRID_WIDTH,
          y1: i * GRID_HEIGHT,
          y2: i * GRID_HEIGHT + GRID_HEIGHT,
          midX: j * GRID_WIDTH + GRID_WIDTH * 0.5,
          midY: i * GRID_HEIGHT + GRID_HEIGHT * 0.5,
          foods: [] as FoodConfig[],
          spikes: [] as SpikeConfig[],
          chickBodies: new Map(),
        };
        this.gridList.push(grid);
      }
    }

    this.schedule(
      this.updateSpriteVisibility,
      VISIBILITY_UPDATE_INTERVAL,
    );
  }

  public addSpike(spike: SpikeConfig) {
    const { x, y } = spike.position;
    for (let i = 0; i < this.gridList.length; i++) {
      const { x1, x2, y1, y2 } = this.gridList[i];

      const insideX = x1 <= x && x < x2;
      const insideY = y1 <= y && y < y2;

      if (insideX && insideY) {
        spike.gridIndex = i;
        this.gridList[i].spikes.push(spike);
        break;
      }
    }
  }

  public addFood(foodInstance: FoodConfig) {
    const { x, y } = foodInstance.state.position;
    for (let i = 0; i < this.gridList.length; i++) {
      const { x1, x2, y1, y2 } = this.gridList[i];

      const insideX = x1 <= x && x < x2;
      const insideY = y1 <= y && y < y2;

      if (insideX && insideY) {
        foodInstance.gridIndex = i;
        this.gridList[i].foods.push(foodInstance);
        break;
      }
    }
  }

  public updateFood(food: FoodConfig) {
    this.removeFood(food);
    this.addFood(food);
  }

  public removeFood(food: FoodConfig) {
    const { gridIndex } = food;

    if (gridIndex === undefined) return;

    const index = this.gridList[gridIndex].foods.indexOf(food);
    if (index > -1) {
      this.gridList[gridIndex].foods.splice(index, 1);
    }
  }

  private updateSpriteVisibility() {
    const { GRID_WIDTH, GRID_HEIGHT } = this;

    this.gridList.forEach((grid) => {
      const x = grid.x1 + GRID_WIDTH / 2;
      const y = grid.y1 + GRID_HEIGHT / 2;
      if (
        this.gameplayCamera?.isRectVisibleInCamera(
          x,
          y,
          GRID_WIDTH,
          GRID_HEIGHT,
        )
      ) {
        // grid.foods.forEach((food) => {
        //   food.object.updateSpriteVisibility();
        // });

        grid.spikes.forEach((spike) => {
          const conf: ObstacleSpriteRef = {
            parent: null,
            position: new Vec2(spike.position.x, spike.position.y),
            dimension: new Vec2(ARENA_DEFAULT_OBJECT_SIZE.SPIKE, ARENA_DEFAULT_OBJECT_SIZE.SPIKE),
            targetOpacity: 255,
          }
          this.obstacleManager?.updateObstacleSpriteVisibility(
            conf,
            ARENA_OBJECT_TYPE.SPIKE,
          );
        });
      }
    });
  }

  private removeBodyOnGrid(coord: Coordinate, playerID: string) {
    const gridIdx = getGridIdxByCoord(coord);
    const currGrid = this.gridList[gridIdx];
    if (currGrid) {
      const gridTotalBodies = currGrid.chickBodies.get(playerID);
      if (gridTotalBodies) {
        currGrid.chickBodies.set(playerID, Math.max(gridTotalBodies - 1, 0));
      } else {
        currGrid.chickBodies.set(playerID, 0);
      }
    }
  }

  private addBodyOnGrid(coord: Coordinate, playerID: string) {
    const gridIdx = getGridIdxByCoord(coord);
    const currGrid = this.gridList[gridIdx];
    if (currGrid) {
      const gridTotalBodies = currGrid.chickBodies.get(playerID);
      if (gridTotalBodies) {
        currGrid.chickBodies.set(playerID, gridTotalBodies + 1);
      } else {
        currGrid.chickBodies.set(playerID, 1);
      }
    }
  }

  onDestroy(): void {
    this.gridList = [];
  }
}
