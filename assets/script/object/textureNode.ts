import { _decorator, Component, Material, Node } from "cc";

const { ccclass, property } = _decorator;

@ccclass("TextureNode")
export class TextureNode extends Component {
  private mat: Material | null = null;

  onLoad() {
    this.mat = new Material();
  }
}
