import { _decorator, Component, EventTouch, Input, input, Node, Vec2, Vec3 } from 'cc';

import { INPUT_EVENT } from '../enum/event';
import { PersistentDataManager } from '../manager/persistentDataManager';

const { ccclass, property } = _decorator;

@ccclass("ArenaInput")
export class ArenaInput extends Component {
  private touchStartCb = (event: EventTouch) => {};

  private touchMoveCb = (event: EventTouch) => {};

  private touchEndCb = (event: EventTouch) => {};

  public startInputListener() {
    this.touchStartCb = this.onTouchStart.bind(this);
    this.touchMoveCb = this.onTouchMove.bind(this);
    this.touchEndCb = this.onTouchEnd.bind(this);

    this.node.on(Input.EventType.TOUCH_START, this.touchStartCb);
    this.node.on(Input.EventType.TOUCH_MOVE, this.touchMoveCb);
    this.node.on(Input.EventType.TOUCH_END, this.touchEndCb);
  }

  public stopInputListener() {
    PersistentDataManager.instance.eventTarget.emit(INPUT_EVENT.END_TOUCH);
    this.node.off(Input.EventType.TOUCH_START, this.touchStartCb);
    this.node.off(Input.EventType.TOUCH_MOVE, this.touchMoveCb);
    this.node.off(Input.EventType.TOUCH_END, this.touchEndCb);
  }

  private onTouchStart(event: EventTouch) {
    const uiLoc = event.getLocation();

    if (!uiLoc) return;

    PersistentDataManager.instance.eventTarget.emit(
      INPUT_EVENT.START_TOUCH,
      uiLoc
    );
  }

  private onTouchMove(event: EventTouch) {
    const uiLoc = event.getLocation();

    PersistentDataManager.instance.eventTarget.emit(
      INPUT_EVENT.MOVE_TOUCH,
      uiLoc
    );
  }

  private onTouchEnd(event: EventTouch) {
    PersistentDataManager.instance.eventTarget.emit(INPUT_EVENT.END_TOUCH);
  }
}
