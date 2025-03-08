import { _decorator, CCFloat, Component, Node, Sprite, tween, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UpAndDown')
export class UpAndDown extends Component {
  @property(Sprite)
  private sprite: Sprite |  null = null;

  @property(CCFloat)
  private height: number = 20;

  @property(CCFloat)
  private duration: number = 1.2;

  private initPos: Vec3 = new Vec3();

  private anim: Tween<any> | null = null;

  private mult: number = 1;

  protected onLoad(): void {
    if (!this.sprite.isValid) return;

    this.initPos = this.sprite.node.position.clone();
  }

  protected start(): void {
    let obj = { val: this.height * this.mult * -1 };

    console.log(this.sprite);
    this.animate(obj);
  }

  private animate(obj: { val : number }) {
    this.anim = tween(obj)
    .to(this.duration, {
      val: this.height * this.mult,
    }, {
      onUpdate: () => {
        this.sprite.node.setPosition(this.initPos.x, Math.floor(this.initPos.y + Math.floor(obj.val / 2) * 2));
      },
      onComplete: () => {
        this.mult *= -1;
        this.animate(obj);
      }
    }).start();
  }

  protected onDestroy(): void {
    if (this.anim && this.isValid) {
      this.anim.stop();
      this.anim = null;
    }
  }
}


