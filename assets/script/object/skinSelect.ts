import {
  _decorator,
  Component,
  instantiate,
  JsonAsset,
  Node,
  Prefab,
  ScrollView,
} from "cc";

import { SKIN_SELECT_EVENT } from "../enum/event";
import { SkinList } from "../interface/skinList";
import { PersistentDataManager } from "../manager/persistentDataManager";
import { SkinSelectItem } from "./skinSelectItem";

const { ccclass, property } = _decorator;

@ccclass("SkinSelect")
export class SkinSelect extends Component {
  @property(JsonAsset)
  private skinJson: JsonAsset | null = null;

  @property(Prefab)
  private skinPref: Prefab | null = null;

  public skinList: SkinList | null = null;

  public itemList: SkinSelectItem[] = [];

  private scrollView: ScrollView | null = null;

  private itemSelCallback = (id: number) => {};

  onLoad() {
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
      this,
    );
  }

  private turnOffListener() {
    PersistentDataManager.instance.eventTarget?.off(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      this.itemSelCallback,
    );
  }

  private selectDefault() {
    PersistentDataManager.instance.eventTarget?.emit(
      SKIN_SELECT_EVENT.ITEM_SELECTED,
      1001,
    );
  }

  private onItemSel(id: number) {
    this.itemList.forEach((item) => {
      if (item.isSelected) {
        item.isSelected = false;
      }

      if (item.skinData?.id === id) {
        item.isSelected = true;
      }
    });
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
