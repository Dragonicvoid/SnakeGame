import { _decorator, CCInteger, Component, Node, tween, Vec2, Vec3 } from "cc";

import { ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
import { GAME_EVENT } from "../enum/event";
import { FoodConfig } from "../interface/food";
import { SnakeConfig } from "../interface/player";
import { FoodSpawner } from "../spawner/foodSpawner";
import { convertPosToCoord } from "../util/arenaConvert";
import { GridManager } from "./gridManager";
import { ObstacleManager } from "./obstacleManager";
import { PersistentDataManager } from "./persistentDataManager";

const { ccclass, property } = _decorator;

@ccclass("FoodManager")
export class FoodManager extends Component {
  @property(FoodSpawner)
  private foodSpawner: FoodSpawner | null = null;

  @property(ObstacleManager)
  private obsManager: ObstacleManager | null = null;

  @property(GridManager)
  private gridManager: GridManager | null = null;

  @property(CCInteger)
  private maxFoodInstance: number = 5;

  @property(CCInteger)
  private foodSpawnInterval: number = 3;

  private maxRetries = 5;

  private foodCounter = 0;

  public foodList: FoodConfig[] = [];

  private foodSpawningCb = (retries?: number) => {};

  start() {
    this.foodSpawningCb = this.spawnRandomFood.bind(this);
  }

  public startSpawningFood() {
    this.foodCounter = 0;
    this.schedule(this.foodSpawningCb, this.foodSpawnInterval);
  }

  public stopSpawningFood() {
    this.unschedule(this.foodSpawningCb);
  }

  private spawnRandomFood(retries: number = 0) {
    if (!this.foodSpawner || retries >= this.maxRetries) return;

    if (this.foodSpawner?.node.children.length >= this.maxFoodInstance) return;

    const pos = new Vec2(
      Math.random() * ARENA_DEFAULT_VALUE.WIDTH - ARENA_DEFAULT_VALUE.WIDTH / 2,
      Math.random() * ARENA_DEFAULT_VALUE.HEIGHT -
        ARENA_DEFAULT_VALUE.HEIGHT / 2,
    );
    const coord = convertPosToCoord(pos.x, pos.y);
    const isSafe = this.obsManager?.isPosSafeForSpawn(coord);

    if (!isSafe) {
      this.spawnRandomFood(retries++);
      return;
    }

    const obj = this.foodSpawner.spawn(pos);

    if (!obj?.isValid) return;

    const food: FoodConfig = {
      id: this.foodCounter.toString(),
      state: {
        position: pos,
        eaten: false,
      },
      gridIndex: undefined,
      object: obj,
    };

    this.gridManager?.addFood(food);
    this.foodList.push(food);

    this.foodCounter++;
  }

  public processEatenFood(player: SnakeConfig, food: FoodConfig) {
    const targetVec = player.state.body[0]?.position.clone() ?? new Vec2(0, 0);
    tween(food.object)
      .to(
        0.1,
        {
          position: new Vec3(targetVec.x, targetVec.y, food.object.position.z),
        },
        {
          onStart: () => {
            food.state.eaten = true;
          },
          onComplete: () => {
            this.removeFood(food);
            PersistentDataManager.instance.eventTarget.emit(
              GAME_EVENT.PLAYER_INCREASE_SIZE,
              player,
            );
          },
        },
      )
      .start();
  }

  private removeFood(food: FoodConfig) {
    this.gridManager?.removeFood(food);
    this.foodSpawner?.removeFood(food.object);
    this.foodList = this.foodList.filter((item) => {
      return item.id !== food.id;
    });
  }

  public removeAllFood() {
    this.foodList.forEach((food) => {
      this.foodSpawner?.removeFood(food.object);
    });

    this.foodList = [];
  }

  public getFoodById(id: string) {
    return this.foodList.find((food) => food.id === id);
  }

  public getFoodByObj(node: Node) {
    return this.foodList.find((food) => food.object === node);
  }
}
