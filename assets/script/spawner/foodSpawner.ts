import { _decorator, Component, Node, random, Vec2 } from "cc";

import { ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
import { BasePooler } from "../pooler/basePooler";

const { ccclass, property } = _decorator;

@ccclass("FoodSpawner")
export class FoodSpawner extends Component {
  @property(Node)
  private parent: Node | null = null;

  @property(BasePooler)
  private pooler: BasePooler | null = null;

  protected onLoad(): void {
    if (!this.parent?.isValid) {
      this.parent = this.node;
    }
  }

  public removeFood(node: Node) {
    this.pooler?.returnNode(node);
  }

  public spawn(pos: Vec2) {
    const food = this.pooler?.getNode();

    if (!food?.isValid) return;

    food.parent = this.parent;
    food.setPosition(pos.x, pos.y);
    food.active = true;

    return food;
  }
}
