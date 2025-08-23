import {
    _decorator, Camera, CCInteger, IAssembler, Material, profiler, RenderTexture, Sprite,
    SpriteFrame, sys, Texture2D, UIRenderer, UITransform, Vec2, Vec3
} from 'cc';
import { EDITOR } from 'cc/env';

import { SnakeAssembler } from '../customAssembler/snakeAssembler';
import { SnakeBody } from '../interface/player';

const { ccclass, property } = _decorator;

@ccclass("SnakeRenderable")
export class SnakeRenderable extends UIRenderer {
  protected _assembler: IAssembler | null = null;
  @property(SpriteFrame)
  public fixError: SpriteFrame = null!;

  @property(Camera)
  public cam: Camera | null = null;

  @property(Sprite)
  public renderSprite: Sprite | null = null;

  @property(Texture2D)
  public bodyTexture: Texture2D | null = null;

  @property(CCInteger)
  public pixelated: number = 0;

  public snakesBody: SnakeBody[] = [];

  private count = 0;

  constructor() {
    super();
  }

  onLoad() {
    this._useVertexOpacity = true;
    if (this.cam?.isValid && this.renderSprite?.isValid) {
      let trans = this.renderSprite.getComponent(UITransform);

      if (!trans?.isValid) return;

      let renderTex = new RenderTexture();
      renderTex.initialize({
        width: trans.width * 2 * (10 / (this.pixelated + 10)),
        height: trans.height * 2 * (10 / (this.pixelated + 10)),
      });

      this.cam.targetTexture = renderTex;

      let sp = new SpriteFrame();
      sp.texture = renderTex;

      if (
        sys.platform == sys.Platform.IOS ||
        sys.platform == sys.Platform.MACOS
      ) {
        sp.flipUVY = true;
      }

      this.renderSprite.spriteFrame = sp;

      // @ts-ignore
      this.renderSprite.updateMaterial();
    }
  }

  start() {
    profiler.hideStats();

    if (!EDITOR) {
      this.markForUpdateRenderData();

      this.scheduleOnce(() => {
        this.setCustomMat();
      });
    }
  }

  public setCustomMat() {
    if (!this.customMaterial?.isValid) return;

    const copyMat = new Material();
    copyMat.copy(this.customMaterial);
    this.customMaterial = copyMat;
    let trans = this.node.getComponent(UITransform);

    if (!trans?.isValid) return;

    this.customMaterial.setProperty("yratio", trans.height / trans.width);
    this.customMaterial.setProperty(
      "reverseRes",
      new Vec2(1.0 / trans.width, 1.0 / trans.height)
    );

    if (this.bodyTexture?.isValid) {
      this.customMaterial.setProperty(
        "mainTexture",
        this.bodyTexture.getGFXTexture()
      );
    }

    this.markForUpdateRenderData();
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
