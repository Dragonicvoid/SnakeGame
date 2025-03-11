import {
  _decorator,
  Camera,
  IAssembler,
  profiler,
  RenderTexture,
  Sprite,
  SpriteFrame,
  sys,
  UIRenderer,
  UITransform,
  Vec2,
  Vec3,
} from "cc";
import { EDITOR } from "cc/env";
import { SnakeAssembler } from "../customAssembler/snakeAssembler";
import { SnakeBody } from "../interface/player";
import { ARENA_DEFAULT_OBJECT_SIZE, ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
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
        width: trans.width,
        height: trans.height,
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

    // this.snakesBody = [
    //   { position: new Vec3(257, 408 ,0) },
    //   { position: new Vec3(235, 417 ,0) },
    //   { position: new Vec3(245, 416 ,0) },
    //   { position: new Vec3(226, 421 ,0) },
    // ]

    if (!EDITOR) {
      this.schedule(() => {
        this.markForUpdateRenderData();
        const totalBodies = Math.floor(Math.random() * 10);
        const bodies: SnakeBody[] = [];
        const radius = ARENA_DEFAULT_OBJECT_SIZE.SNAKE;
        let prevBodies: SnakeBody | null = null;
        for (let i = 0; i < totalBodies; i++) {
          if (!prevBodies) {
            const newPos = new Vec3(Math.random() * ARENA_DEFAULT_VALUE.WIDTH, Math.random() * ARENA_DEFAULT_VALUE.HEIGHT, 0);
            const newBody = {
              position: new Vec3(Math.floor(newPos.x), Math.floor(newPos.y), 0),
            };
            bodies.push(newBody);
            prevBodies = newBody;
          } else {
            const prevPos: Vec3 = prevBodies.position;
            const posVec = new Vec3(0, radius, 0);
            let newPos = prevPos.clone();
            const angle = Math.random() * 180 * (Math.PI / 180);
            const rotMat = [
              [Math.cos(angle), -Math.sin(angle)],
              [Math.sin(angle), Math.cos(angle)],
            ];
            newPos = new Vec3(
              (posVec.x * rotMat[0][0] + posVec.y * rotMat[0][1]) + prevPos.x,
              (posVec.x * rotMat[1][0] + posVec.y * rotMat[1][1]) + prevPos.y,
              0
            );
            const newBody = {
              position: new Vec3(Math.floor(newPos.x), Math.floor(newPos.y), 0),
            };
            bodies.push(newBody);
            prevBodies = newBody;
          }
        }

        this.snakesBody = bodies;
      }, 1.0);

      this.scheduleOnce(() => {
        this.setCustomMat();
      });
    }
  }

  public setCustomMat() {
    if (!this.customMaterial?.isValid) return;

    let trans = this.node.getComponent(UITransform);

    if (!trans?.isValid) return;

    this.customMaterial.setProperty("yratio", trans.height / trans.width);
    this.customMaterial.setProperty(
      "reverseRes",
      new Vec2(1.0 / trans.width, 1.0 / trans.height),
    );

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

  protected setSnakeBody(bodies: SnakeBody[]) {
    this.snakesBody = bodies;
  }
}
