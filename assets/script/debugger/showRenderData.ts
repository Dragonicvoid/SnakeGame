import { _decorator, Component, Node, Sprite } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ShowRenderData")
export class ShowRenderData extends Component {
  protected onLoad(): void {
    console.log(this.getComponent(Sprite)?.renderData);
    console.log(this.node.worldMatrix);
  }
}
