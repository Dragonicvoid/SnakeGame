import { _decorator, Component, Label, Node } from "cc";

import { GameOverData } from "../interface/gameOver";

const { ccclass, property } = _decorator;

@ccclass("UIManager")
export class UIManager extends Component {
  @property(Node)
  startUI: Node | null = null;

  @property(Node)
  endUI: Node | null = null;

  @property(Label)
  endLabel: Label | null = null;

  public showStartUI(val = true) {
    if (!this.startUI?.isValid) return;

    this.startUI.active = val;
  }

  public showEndUI(data?: GameOverData, val = true) {
    if (!this.endUI?.isValid) return;

    this.endUI.active = val;

    if (!this.endLabel?.isValid) return;

    this.endLabel.string = !data?.isWon ? "You Lose" : "You Won";
  }
}
