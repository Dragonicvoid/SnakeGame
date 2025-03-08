import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("PersistentDataManager")
export class PersistentDataManager extends Component {
  private static _instance: PersistentDataManager | null = null;

  static get instance(): PersistentDataManager {
    if (!PersistentDataManager._instance) {
      PersistentDataManager._instance = new PersistentDataManager();
    }

    return PersistentDataManager._instance;
  }

  public selectedMap = 0;

  protected onLoad(): void {
    PersistentDataManager._instance = this;
  }
}
