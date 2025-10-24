import { _decorator, Component, Node, tween, Tween, Vec2 } from 'cc';

import { SnakeRenderablePrev } from '../customRenderable2D/snakeRenderablePrev';
import { ARENA_DEFAULT_OBJECT_SIZE } from '../enum/arenaConfig';
import { sleep } from '../util/other';

const { ccclass, property } = _decorator;

@ccclass("StartSnakePrev")
export class StartSnakePrev extends Component {
  @property(SnakeRenderablePrev)
  private snakeRender: SnakeRenderablePrev | null = null;

  private snakeSize = ARENA_DEFAULT_OBJECT_SIZE.SNAKE;

  private tween: Tween<any>[] = [];

  private danceLength = ARENA_DEFAULT_OBJECT_SIZE.SNAKE * 0.1;

  private mult: number[] = [];

  private snakeShape = [
    {
      position: new Vec2(0, this.snakeSize * 2),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * 1),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * 0),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * -1),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * -2),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    }
  ];

  onLoad() {
    this.snakeRender?.setSnakeBody(this.snakeShape);
    this.startSnakeDance();
  }

  private async startSnakeDance() {
    for (let i = 0; i < this.snakeShape.length; i++) {
      this.mult[i] = 1;
      let obj = { val: 0 };
      this.animDance(obj, i);
      await sleep(250);
    }
  }

  private animDance(obj: any, idx: number) {
    this.tween[idx] = tween(obj)
      .to(
        0.5,
        { val: (Math.PI / 2) * this.mult[idx] },
        {
          onUpdate: () => {
            const sinVal = Math.sin(obj.val);

            this.snakeShape[idx]?.position.set(
              sinVal * this.danceLength,
              this.snakeShape[idx].position.y,
            );
          },
          onComplete: () => {
            this.mult[idx] *= -1;
            this.animDance(obj, idx);
          },
        },
      )
      .start();
  }
}
