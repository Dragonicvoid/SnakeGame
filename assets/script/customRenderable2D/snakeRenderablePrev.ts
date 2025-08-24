import {
  _decorator,
  Camera,
  CCInteger,
  EffectAsset,
  IAssembler,
  Material,
  profiler,
  RenderTexture,
  resources,
  Sprite,
  SpriteFrame,
  sys,
  Texture2D,
  UIRenderer,
  UITransform,
  Vec2,
  Vec3,
} from "cc";

import { SnakeAssembler } from "../customAssembler/snakeAssembler";
import { SnakeBody } from "../interface/player";

const { ccclass, property } = _decorator;

@ccclass("SnakeRenderablePrev")
export class SnakeRenderablePrev extends UIRenderer {
  protected _assembler: IAssembler | null = null;
  @property(SpriteFrame)
  public fixError: SpriteFrame = null!;

  @property(Texture2D)
  public bodyTexture: Texture2D | null = null;

  public snakesBody: SnakeBody[] = [];

  private count = 0;

  constructor() {
    super();
  }

  onLoad() {
    this._useVertexOpacity = true;
  }

  start() {
    profiler.hideStats();

    this.markForUpdateRenderData();

    this.scheduleOnce(() => {
      this.setCustomMat();
    });
  }

  public setCustomMat() {
    const copyMat = new Material();
    resources.load(["effect/snakeRender"], EffectAsset, (err, data) => {
      copyMat.initialize({
        effectName: "../resources/effect/snakeRender",
      });

      this.customMaterial = copyMat;
      let trans = this.node.getComponent(UITransform);

      if (!trans?.isValid) return;

      this.customMaterial.setProperty("yratio", trans.height / trans.width);
      this.customMaterial.setProperty(
        "reverseRes",
        new Vec2(1.0 / trans.width, 1.0 / trans.height),
      );

      if (this.bodyTexture?.isValid) {
        this.customMaterial.setProperty(
          "mainTexture",
          this.bodyTexture.getGFXTexture(),
        );
      }

      this.markForUpdateRenderData();
    });
  }

  protected _render(render: any) {
    render.commitComp(this, this._renderData, this.fixError, this._assembler!);
  }

  protected _canRender() {
    return true;
  }

  protected _flushAssembler(): void {
    if (this._assembler === null) {
      this._assembler = new SnakeAssembler();
      this._renderData = this._assembler.createData(this);
    }
  }

  public setSnakeBody(bodies: SnakeBody[]) {
    this.snakesBody = bodies;
  }
}
