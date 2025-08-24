import {
  _decorator,
  CCBoolean,
  Component,
  EffectAsset,
  Label,
  Material,
  Node,
  resources,
  Sprite,
  SpriteFrame,
} from "cc";

import { SKIN_SELECT_EVENT } from "../enum/event";
import { SkinDetail } from "../interface/skinList";
import { PersistentDataManager } from "../manager/persistentDataManager";

const { ccclass, property } = _decorator;

@ccclass("SkinSelectItem")
export class SkinSelectItem extends Component {
  @property(Sprite)
  private preview: Sprite | null = null;

  @property(Label)
  private labelName: Label | null = null;

  @property(Node)
  private selectSprite: Node | null = null;

  @property(CCBoolean)
  public set isSelected(v: boolean) {
    this._isSelected = v;
    this.setBackground();
  }

  public get isSelected() {
    return this._isSelected;
  }

  private _isSelected: boolean = false;

  public skinData: SkinDetail | null = null;

  private mat: Material | null = null;

  public setSkinData(data: SkinDetail) {
    this.skinData = data;
    this.setName();
    this.setSprite();
  }

  public onClick() {
    PersistentDataManager.instance.eventTarget?.emit(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      this.skinData?.id,
    );
  }

  private setName() {
    if (!this.labelName?.isValid || !this.skinData) return;

    this.labelName.string = this.skinData.name;
  }

  private setSprite() {
    if (!this.preview?.isValid || !this.skinData) return;

    if (!this.mat?.isValid) {
      this.mat = new Material();
    }

    this.preview.customMaterial = null;
    if (this.skinData.effect_name) {
      resources.load([this.skinData.effect_name], EffectAsset, (err, data) => {
        if (!this.preview?.isValid || !this.skinData) return;

        this.mat?.initialize({
          effectName: "../resources/" + this.skinData.effect_name,
          defines: this.skinData.defines,
        });

        this.preview.customMaterial = this.mat;
      });
    } else {
      this.mat.initDefault();
    }

    if (this.skinData.sprite_frame) {
      resources.load(
        this.skinData.sprite_frame + "/spriteFrame",
        SpriteFrame,
        (err, asset) => {
          if (!this.preview?.isValid || err) return;

          this.preview.spriteFrame = asset;
        },
      );
    }
  }

  private setBackground() {
    if (!this.selectSprite?.isValid) return;

    this.selectSprite.active = this.isSelected;
  }
}
