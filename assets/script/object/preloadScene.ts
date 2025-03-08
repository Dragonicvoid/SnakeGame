import { _decorator, Component, director, Node } from "cc";
import { PersistentDataManager } from "../manager/persistentDataManager";
import { configMaps } from "../defaultValue/map";
import { SCENE_KEY } from "../enum/scene";
const { ccclass, property } = _decorator;

@ccclass("PreloadScene")
export class PreloadScene extends Component {
  protected start(): void {
    if (!PersistentDataManager.instance) return;

    PersistentDataManager.instance.selectedMap = Math.floor(
      Math.random() * configMaps.length,
    );
    director.loadScene(SCENE_KEY.GAMEPLAY);
  }
}
