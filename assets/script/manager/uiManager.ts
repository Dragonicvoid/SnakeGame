import { _decorator, Component, Label, Node, Vec2, Vec3 } from 'cc';

import { INPUT_EVENT } from '../enum/event';
import { GameOverData } from '../interface/gameOver';
import { PersistentDataManager } from './persistentDataManager';

const { ccclass, property } = _decorator;

@ccclass("UIManager")
export class UIManager extends Component {
  @property(Node)
  private startUI: Node | null = null;

  @property(Node)
  private endUI: Node | null = null;

  @property(Label)
  private endLabel: Label | null = null;

  @property(Node)
  private movUI: Node | null = null;

  @property(Node)
  private movUIFront: Node | null = null;

  private movMaxLength = 50;

  private touchStartCb = (pos: Vec2) => {};

  private touchMoveCb = (pos: Vec2) => {};

  private touchEndCb = () => {};

  onLoad() {
    this.setListener();
  }

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

  private setListener() {
    this.touchStartCb = this.onTouchStart.bind(this);
    this.touchMoveCb = this.onTouchMove.bind(this);
    this.touchEndCb = this.onTouchEnd.bind(this);

    PersistentDataManager.instance.eventTarget.on(
      INPUT_EVENT.START_TOUCH,
      this.touchStartCb
    );
    PersistentDataManager.instance.eventTarget.on(
      INPUT_EVENT.MOVE_TOUCH,
      this.touchMoveCb
    );
    PersistentDataManager.instance.eventTarget.on(
      INPUT_EVENT.END_TOUCH,
      this.touchEndCb
    );
  }

  private onTouchStart(pos: Vec2) {
    this.showMovUI(true, pos);
  }

  private onTouchMove(pos: Vec2) {
    this.setMovUIFrontDelta(pos);
  }

  private onTouchEnd() {
    this.showMovUI(false);
  }

  private showMovUI(show: boolean = true, pos?: Vec2) {
    if (!this.movUI?.isValid) return;

    this.movUI.active = show;

    if (!show) {
      this.movUIFront?.setPosition(0, 0);
    }

    if (!pos || !show) return;

    this.movUI.setWorldPosition(new Vec3(pos.x, pos.y, this.movUI.position.z));
  }

  private setMovUIFrontDelta(pos: Vec2) {
    if (!this.movUIFront?.isValid) return;

    const currPos = new Vec2(
      this.movUI?.worldPosition.x,
      this.movUI?.worldPosition.y
    );
    const dist = Vec2.distance(currPos, pos);
    const dir = new Vec2(pos.x - currPos.x, pos.y - currPos.y);
    if (dist > this.movMaxLength) {
      const normVec = new Vec2(0, 0);
      Vec2.normalize(normVec, dir);
      normVec.multiplyScalar(this.movMaxLength);
      this.movUIFront.setPosition(normVec.x, normVec.y);
      this.movUI?.setWorldPosition(
        pos.x - normVec.x,
        pos.y - normVec.y,
        this.movUI.position.z
      );
      dir.set(normVec.x, normVec.y);
    } else {
      this.movUIFront.setPosition(dir.x, dir.y);
    }

    PersistentDataManager.instance.eventTarget.emit(
      INPUT_EVENT.MOVE_TOUCH_CALCULATED,
      dir
    );
  }

  onDestroy() {
    PersistentDataManager.instance.eventTarget.off(
      INPUT_EVENT.START_TOUCH,
      this.touchStartCb
    );
    PersistentDataManager.instance.eventTarget.off(
      INPUT_EVENT.MOVE_TOUCH,
      this.touchMoveCb
    );
    PersistentDataManager.instance.eventTarget.off(
      INPUT_EVENT.END_TOUCH,
      this.touchEndCb
    );
  }
}
