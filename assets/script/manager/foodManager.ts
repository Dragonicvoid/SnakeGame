import { _decorator, CCInteger, Component, Node, Vec2 } from "cc";

import { ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
import { FoodConfig } from "../interface/food";
import { FoodSpawner } from "../spawner/foodSpawner";
import { convertPosToCoord } from "../util/arenaConvert";
import { ObstacleManager } from "./obstacleManager";

const { ccclass, property } = _decorator;

@ccclass("FoodManager")
export class FoodManager extends Component {
  @property(FoodSpawner)
  private foodSpawner: FoodSpawner | null = null;

  @property(ObstacleManager)
  private obsManager: ObstacleManager | null = null;

  @property(CCInteger)
  private maxFoodInstance: number = 5;

  @property(CCInteger)
  private foodSpawnInterval: number = 3;

  private maxRetries = 5;

  public foodList: FoodConfig[] = [];

  public startSpawningFood() {
    this.schedule(() => {
      this.spawnRandomFood();
    }, this.foodSpawnInterval);
  }

  private spawnRandomFood(retries: number = 0) {
    if (!this.foodSpawner || retries >= this.maxRetries) return;

    if (this.foodSpawner?.node.children.length >= this.maxFoodInstance) return;

    const pos = new Vec2(
      Math.random() * ARENA_DEFAULT_VALUE.WIDTH,
      Math.random() * ARENA_DEFAULT_VALUE.HEIGHT,
    );
    const coord = convertPosToCoord(pos.x, pos.y);
    const isSafe = this.obsManager?.isPosSafeForSpawn(coord);

    if (!isSafe) {
      this.spawnRandomFood(retries++);
      return;
    }

    this.foodSpawner.spawn(pos);
  }

  public getFoodById(id: string) {
    return this.foodList.find((food) => food.id === id);
  }
}
