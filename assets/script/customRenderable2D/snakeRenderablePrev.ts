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
import { ASSET_LOAD_EVENT } from "../enum/event";
import { SnakeType } from "../enum/snakeType";
import { SnakeBody } from "../interface/player";
import { SkinDetail } from "../interface/skinList";
import { PersistentDataManager } from "../manager/persistentDataManager";
import { getEffectFromSnakeType, modifyFragShader } from "../util/shaderModify";

const { ccclass, property } = _decorator;

@ccclass("SnakeRenderablePrev")
export class SnakeRenderablePrev extends UIRenderer {
  protected _assembler: IAssembler | null = null;
  @property(SpriteFrame)
  public fixError: SpriteFrame = null!;

  @property(Texture2D)
  public bodyTexture: Texture2D | null = null;

  public snakesBody: SnakeBody[] = [];

  private _snakeType: SnakeType = SnakeType.NORMAL;

  public set snakeType(val: SnakeType) {
    this._snakeType = val;
    this.setMatByType();
  }

  public get snakeType() {
    return this._snakeType;
  }

  private _skinData: SkinDetail | null = null;

  public set skinData(val: SkinDetail | null) {
    this._skinData = val;
    this.setSnakeSkin();
  }

  public get skinData() {
    return this._skinData;
  }

  constructor() {
    super();
  }

  onLoad() {
    this._useVertexOpacity = true;
  }

  start() {
    this.markForUpdateRenderData();
    this.setMatByType();
  }

  public setMatByType() {
    const effectData = getEffectFromSnakeType(this.snakeType);
    const mat = new Material();
    resources.load([effectData.resourceName], EffectAsset, (_, data) => {
      mat.initialize({
        effectName: effectData.effectName,
        defines: {
          USE_TEXTURE: true,
        },
      });

      this.customMaterial = mat;
      this.markForUpdateRenderData();
      this.setSnakeSkin();

      PersistentDataManager.instance.eventTarget.emit(
        ASSET_LOAD_EVENT.INIT_DEF_MAT_COMPLETE,
      );
    });
  }

  public setSnakeSkin() {
    if (!this.skinData || !this.customMaterial) return;

    let trans = this.node.getComponent(UITransform);
    if (!trans?.isValid) return;
    const newMat = modifyFragShader(
      this.customMaterial,
      this.skinData.effect_code,
      this.snakeType,
      this.skinData.id.toString(),
    );

    this.customMaterial = newMat ?? null;
    this.customMaterial?.setProperty("yratio", trans.height / trans.width);

    if (this.skinData.sprite_frame) {
      resources.load(
        this.skinData.sprite_frame + "/spriteFrame",
        SpriteFrame,
        (err, asset) => {
          if (!this?.isValid || err) return;
          this.customMaterial?.setProperty(
            "mainTexture",
            asset.getGFXTexture(),
          );
        },
      );
    }
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
    }
    //@ts-ignore
    this._renderData = this._assembler.createData(this);
  }

  public setSnakeBody(bodies: SnakeBody[]) {
    this.snakesBody = bodies;
  }
}
