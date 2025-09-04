import { _decorator, Component, Node } from 'cc';

import { ACTION_SCORE } from '../enum/actionScore';
import { PlannerFactor } from '../interface/ai';
import { SnakeActionData, SnakeConfig } from '../interface/player';
import { BaseAction } from './baseAction';

const { ccclass, property } = _decorator;

@ccclass("GoToFood")
export class GoToFood extends BaseAction {
  private minBodySize = 9;

  public init() {}

  public onChange() {}

  public run(player: SnakeConfig, data: SnakeActionData) {
    this.player = player;
    this.currData = data;

    const foodTarget = data.detectedFood;

    if (!foodTarget) return;

    const foodAngle = this.processBotMovementByFood(player, foodTarget);
    this.updateDirection(foodAngle);
  }

  public updateScore(factor: PlannerFactor) {
    const food = factor.detectedFood;
    const foodScore = food ? ACTION_SCORE.FOUND_FOOD_NEARBY : 0;

    const bodyFactor = Math.max(
      factor.player.state.body.length - this.minBodySize,
      0,
    );
    const bodyFactScore = bodyFactor * ACTION_SCORE.SMALL_BODY;

    this.score = bodyFactScore + foodScore;
    return this.score;
  }
}
