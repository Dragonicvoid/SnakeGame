import { _decorator, Component, instantiate, JsonAsset, math, Node, Prefab, ScrollView } from 'cc';

import { SnakeRenderablePrev } from '../customRenderable2D/snakeRenderablePrev';
import { ASSET_LOAD_EVENT, SKIN_SELECT_EVENT } from '../enum/event';
import { SnakeType } from '../enum/snakeType';
import { SkinDetail, SkinList } from '../interface/skinList';
import { PersistentDataManager } from '../manager/persistentDataManager';
import { SkinSelectItem } from './skinSelectItem';

const { ccclass, property } = _decorator;

@ccclass("SkinSelect")
export class SkinSelect extends Component {
  @property(JsonAsset)
  private skinJson: JsonAsset | null = null;

  @property(Prefab)
  private skinPref: Prefab | null = null;

  @property(SnakeRenderablePrev)
  private snakePrev: SnakeRenderablePrev | null = null;

  public skinList: SkinList | null = null;

  public itemList: SkinSelectItem[] = [];

  private scrollView: ScrollView | null = null;

  private itemSelCallback = (id: number) => {};

  onLoad() {
    PersistentDataManager.instance.eventTarget.once(
      ASSET_LOAD_EVENT.INIT_DEF_MAT_COMPLETE,
      () => {
        this.initSkinSelect();
      }
    );
  }

  public initSkinSelect() {
    this.setCallback();

    if (!this.skinJson?.isValid) return;

    this.skinList = this.skinJson.json as SkinList;
    this.scrollView = this.getComponent(ScrollView);

    this.skinList.skins.forEach((skin) => {
      if (!this.scrollView?.isValid) return;

      const item = this.createPref();

      if (!item) return;

      item.selectSkinItem.setSkinData(skin);
      item.node.setParent(this.scrollView.content);
    });
    this.setListener();
    this.selectDefault();
  }

  private setCallback() {
    this.itemSelCallback = this.onItemSel.bind(this);
  }

  private setListener() {
    PersistentDataManager.instance.eventTarget?.on(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      this.itemSelCallback,
      this
    );
  }

  private turnOffListener() {
    PersistentDataManager.instance.eventTarget?.off(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      this.itemSelCallback
    );
  }

  private selectDefault() {
    PersistentDataManager.instance.eventTarget?.emit(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      2001
    );
  }

  private onItemSel(id: number) {
    let selectedSkin: SkinSelectItem | undefined;
    this.itemList.forEach((item) => {
      if (item.isSelected) {
        item.isSelected = false;
      }

      if (item.skinData?.id === id) {
        item.isSelected = true;
        selectedSkin = item;
      }
    });

    if (!selectedSkin?.skinData || !this.snakePrev?.isValid) return;

    this.snakePrev.skinData = selectedSkin.skinData;
  }

  private createPref() {
    if (!this.skinPref?.isValid) return null;

    const node = instantiate(this.skinPref);
    const selectSkinItem = node.getComponent(SkinSelectItem);

    if (!selectSkinItem?.isValid) {
      node.destroy();
      return null;
    }

    this.itemList.push(selectSkinItem);
    return { node: node, selectSkinItem: selectSkinItem };
  }

  public getPlayerSkinData() {
    return {
      skin: this.snakePrev?.skinData,
      type: this.snakePrev?.snakeType,
    };
  }

  public getEnemySkinData() {
    let randomSkin: SkinDetail | undefined = undefined;
    let snakeType: SnakeType = SnakeType.NORMAL;

    if (this.skinList?.skins) {
      let skins = [...this.skinList.skins];
      skins = skins.filter((skin) => {
        return skin.id !== this.snakePrev?.skinData?.id;
      });

      randomSkin = skins[Math.floor(Math.random() * 0.99 * skins.length)];
    }

    const enumVal = Object.keys(SnakeType)
    const typeRand = Math.floor(Math.random() * enumVal.length);
    const randomEnumKey = enumVal[typeRand];
    snakeType = SnakeType[randomEnumKey as SnakeType];

    return {
      skin: randomSkin,
      type: snakeType,
    };
  }

  onEnable(): void {
    this.setListener();
  }

  onDisable(): void {
    this.turnOffListener();
  }

  onDestroy(): void {
    this.turnOffListener();
  }
}
