import { _decorator, Component, Node } from "cc";
import { SnakeConfig } from "../interface/player";
import { SNAKE_CONFIG } from "../enum/snakeConfig";
const { ccclass, property } = _decorator;

@ccclass("PlayerManager")
export class PlayerManager extends Component {
  public playerList: SnakeConfig[] = [];

  private PLAYER_ID = "MAIN_PLAYER";

  public findNearestPlayerTowardPoint(
    currentPlayer: SnakeConfig,
    radius: number,
  ) {
    const duplicateAngleDetection: Array<number> = [];
    const detectedObstacleAngles: Array<number> = [];
    const { state } = currentPlayer;

    const botHeadPos = state.body[0];

    this.playerList.forEach((otherPlayer) => {
      if (otherPlayer.id === currentPlayer.id) return;

      const idxLen = otherPlayer.state.body.length;
      for (let i = 1; i < idxLen; i++) {
        const detectOtherPlayer = this.isCircleOverlap(
          botHeadPos.position.x,
          botHeadPos.position.y,
          otherPlayer.state.body[i].position.x,
          otherPlayer.state.body[i].position.y,
          radius,
          SNAKE_CONFIG.RADIUS,
        );

        if (detectOtherPlayer) {
          const obstacleAngle = Math.atan2(
            botHeadPos.position.y - otherPlayer.state.body[i].position.y,
            botHeadPos.position.x - otherPlayer.state.body[i].position.x,
          );
          if (duplicateAngleDetection.indexOf(obstacleAngle) === -1) {
            duplicateAngleDetection.push(obstacleAngle);
            const angleInDegree = (obstacleAngle * 180) / Math.PI;
            detectedObstacleAngles.push(angleInDegree);
          }
        }
      }
    });
    return detectedObstacleAngles;
  }

  private isCircleOverlap(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r1: number,
    r2: number,
  ) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.pow(deltaX, 2) + Math.pow(deltaY, 2) <= Math.pow(r1 + r2, 2);
  }

  public getMainPlayer() {
    return this.getPlayerById(this.PLAYER_ID);
  }

  public getPlayerById(id: string) {
    return this.playerList.find((item) => item.id === id);
  }
}
