import {
  _decorator,
  Camera,
  Color,
  Component,
  EventKeyboard,
  input,
  Input,
  KeyCode,
  Node,
  v2,
  view,
} from "cc";

import { CAMERA_DIMENSION_MULTIPLIER } from "../enum/cameraConfig";
import { SnakeConfig } from "../interface/player";
import { checkAABBCollision } from "../util/algorithm";
import { shouldDebug } from "../util/query";

const { ccclass, property } = _decorator;

export enum GAMEPLAY_CAMERA_EVENT {
  LOCK_ON = "lock_on",
  CHANGE_PLAYER = "change-player",
}

@ccclass("GameplayCamera")
export class GameplayCamera extends Component {
  private defaultOrthoHeight = 320;

  private playerToFollow?: SnakeConfig;

  private camera?: Camera | null;

  /**
   * Camera dimension used to determine node visibility
   */
  private cameraDimension = v2(0, 0);

  private onKeyboardUpCallback = (event: EventKeyboard) => {};

  onLoad() {
    this.camera = this.getComponent(Camera);
    this.setupCameraInput();
  }

  private setupCameraInput() {
    const debug = shouldDebug();

    this.onKeyboardUpCallback = this.onKeyboardUp.bind(this);

    if (debug) {
      input.off(Input.EventType.KEY_UP, this.onKeyboardUpCallback);
      input.on(Input.EventType.KEY_UP, this.onKeyboardUpCallback, this);
    }
  }

  public setPlayerToFollow(playerInstance: SnakeConfig) {
    this.playerToFollow = playerInstance;
    if (this.isValid) this.node?.emit(GAMEPLAY_CAMERA_EVENT.LOCK_ON);
  }

  private updatePosition() {
    const playerHead = this.playerToFollow?.state.body[0];
    if (playerHead) {
      const { x, y } = playerHead.position;
      this.moveTo(x, y);
    }
  }

  private moveTo(targetX: number, targetY: number) {
    const { z } = this.node.position;

    this.node.setPosition(targetX, targetY, z);
  }

  private onKeyboardUp(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.KEY_D:
        if (this.isValid)
          this.node?.emit(GAMEPLAY_CAMERA_EVENT.CHANGE_PLAYER, 1);
        break;
      case KeyCode.KEY_A:
        if (this.isValid)
          this.node?.emit(GAMEPLAY_CAMERA_EVENT.CHANGE_PLAYER, -1);
        break;
    }
  }

  setCameraClearColor(color: Color) {
    if (!this.camera?.isValid) return;
    this.camera.clearColor = color;
  }

  setCameraScale(scale: number) {
    const { camera, defaultOrthoHeight } = this;
    if (camera) {
      camera.orthoHeight = defaultOrthoHeight * scale;
    }
    this.updateCameraDimension();
  }

  getCameraScale() {
    if (!this.camera) return 1;
    return this.camera.orthoHeight / this.defaultOrthoHeight;
  }

  private updateCameraDimension() {
    const { width, height } = view.getVisibleSize();
    const cameraScale = this.getCameraScale();

    this.cameraDimension.set(
      width * cameraScale * CAMERA_DIMENSION_MULTIPLIER,
      height * cameraScale * CAMERA_DIMENSION_MULTIPLIER,
    );
  }

  lateUpdate() {
    this.updatePosition();
  }

  /**
   * Checks for node visibility in camera using AABB collision
   * @param node
   * @param offsetX
   * @param offsetY
   * @param nodeWidth
   * @param nodeHeight
   * @returns true if visible, false if not visible
   */
  public isNodeVisibleInCamera(
    node: Node,
    offsetX = 0,
    offsetY = 0,
    nodeWidth = 0,
    nodeHeight = 0,
  ) {
    const nodeX = node.position.x + offsetX;
    const nodeY = node.position.y + offsetY;

    return this.isRectVisibleInCamera(nodeX, nodeY, nodeWidth, nodeHeight);
  }

  public isRectVisibleInCamera(
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const { x: cameraX, y: cameraY } = this.node.position;
    const { x: cameraWidth, y: cameraHeight } = this.cameraDimension;

    return checkAABBCollision(
      cameraX,
      cameraY,
      cameraWidth,
      cameraHeight,
      x,
      y,
      width,
      height,
    );
  }
}
