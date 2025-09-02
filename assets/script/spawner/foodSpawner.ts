import { _decorator, Component, Node, random, Vec2 } from 'cc';

import { ARENA_DEFAULT_VALUE } from '../enum/arenaConfig';
import { BasePooler } from '../pooler/basePooler';
import { convertPosToArenaPos } from '../util/arenaConvert';

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
    const targetPos: Vec2 = convertPosToArenaPos(pos.x, pos.y);

    const food = this.pooler?.getNode();

    if (!food?.isValid) return;

    food.parent = this.parent;
    food.setPosition(targetPos.x, targetPos.y);
    food.active = true;

    return food
  }
}
