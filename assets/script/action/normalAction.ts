import { _decorator, Component, Node } from 'cc';

import { ACTION_SCORE } from '../enum/actionScore';
import { PlannerFactor } from '../interface/ai';
import { SnakeActionData, SnakeConfig } from '../interface/player';
import { BaseAction } from './baseAction';

const { ccclass, property } = _decorator;

@ccclass("NormalAction")
export class NormalAction extends BaseAction {
  public init() {}

  public run(player: SnakeConfig, data: SnakeActionData) {
    const detectedObs = [...data.detectedWall, ...data.detectedPlayer];
    const dodgeAngle = this.processBotMovementByFatalObs(player, detectedObs);

    if (dodgeAngle) {
      this.updateDirection(dodgeAngle)
    }
  }

  public updateScore(factor: PlannerFactor) {
    if (factor.detectedWall.length) {
      return ACTION_SCORE.OBSTACLE_DETECTED;
    }

    return ACTION_SCORE.GO_TO_PLAYER_DEFAULT;
  }
}
