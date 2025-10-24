import { _decorator, Component, game, math, Vec2 } from "cc";

import { ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
import { FoodConfig } from "../interface/food";
import { GridConfig, SpikeConfig } from "../interface/gridConfig";
import { Coordinate } from "../interface/map";
import { GameplayCamera } from "../object/gameplayCamera";
import { getGridIdxByPos } from "../util/arenaConvert";

const { ccclass, property } = _decorator;

@ccclass("GridManager")
export class GridManager extends Component {
  @property(GameplayCamera)
  public readonly gameplayCamera?: GameplayCamera;

  public gridList: GridConfig[] = [];

  private GRID_WIDTH = ARENA_DEFAULT_VALUE.GRID_WIDTH;
  private GRID_HEIGHT = ARENA_DEFAULT_VALUE.GRID_HEIGHT;

  protected onLoad(): void {
    this.setup();
  }

  public setup() {
    const { GRID_WIDTH, GRID_HEIGHT } = this;

    const maxCol = Math.ceil(ARENA_DEFAULT_VALUE.WIDTH / GRID_WIDTH);
    const maxRow = Math.ceil(ARENA_DEFAULT_VALUE.HEIGHT / GRID_HEIGHT);
    this.gridList = [];

    for (let i = 0; i < maxRow; i++) {
      for (let j = 0; j < maxCol; j++) {
        const grid: GridConfig = {
          x1: j * GRID_WIDTH - ARENA_DEFAULT_VALUE.WIDTH / 2,
          x2: j * GRID_WIDTH + GRID_WIDTH - ARENA_DEFAULT_VALUE.WIDTH / 2,
          y1: i * GRID_HEIGHT - ARENA_DEFAULT_VALUE.HEIGHT / 2,
          y2: i * GRID_HEIGHT + GRID_HEIGHT - ARENA_DEFAULT_VALUE.HEIGHT / 2,
          midX:
            j * GRID_WIDTH + GRID_WIDTH * 0.5 - ARENA_DEFAULT_VALUE.WIDTH / 2,
          midY:
            i * GRID_HEIGHT +
            GRID_HEIGHT * 0.5 -
            ARENA_DEFAULT_VALUE.HEIGHT / 2,
          foods: [] as FoodConfig[],
          spikes: [] as SpikeConfig[],
          chickBodies: new Map(),
        };
        this.gridList.push(grid);
      }
    }
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

  private removeBodyOnGrid(coord: Coordinate, playerID: string) {
    const gridIdx = getGridIdxByPos(coord);

    if (gridIdx === undefined) return;

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
    const gridIdx = getGridIdxByPos(coord);

    if (gridIdx === undefined) return;

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
