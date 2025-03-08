import { _decorator, Component, Node } from "cc";
import { BaseAction } from "../action/baseAction";
import { PlannerFactor } from "../interface/ai";
import { PriorityQueue } from "./priorityQueue";
const { ccclass, property } = _decorator;

@ccclass("BotPlanner")
export class BotPlanner extends Component {
  public plan(actions: BaseAction[], factor: PlannerFactor): BaseAction | null {
    const queue: PriorityQueue<BaseAction> = new PriorityQueue((a, b) => {
      return a.score > b.score;
    });

    for (let act of actions) {
      act.updateScore(factor);
      queue.enqueue([act]);
    }

    const result: BaseAction | undefined = queue.dequeue();

    if (!result) return null;

    return result;
  }
}
