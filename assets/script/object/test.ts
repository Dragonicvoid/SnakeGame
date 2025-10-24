import {
  _decorator,
  assetManager,
  AssetManager,
  Component,
  EffectAsset,
  Node,
} from "cc";

const { ccclass, property } = _decorator;

@ccclass("test")
export class test extends Component {
  @property(Node)
  private snake: Node | null = null;

  protected start(): void {
    console.log(assetManager.assets);
    this.scheduleOnce(() => {
      if (!this.snake?.isValid) return;

      this.snake.active = true;
    }, 0);
  }
}
