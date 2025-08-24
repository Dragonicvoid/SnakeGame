import { _decorator, Component, Node, tween, Tween, Vec2 } from "cc";

import { SnakeRenderablePrev } from "../customRenderable2D/snakeRenderablePrev";
import { ARENA_DEFAULT_OBJECT_SIZE } from "../enum/arenaConfig";

const { ccclass, property } = _decorator;

@ccclass("StartSnakePrev")
export class StartSnakePrev extends Component {
  @property(SnakeRenderablePrev)
  private snakeRender: SnakeRenderablePrev | null = null;

  private snakeSize = ARENA_DEFAULT_OBJECT_SIZE.SNAKE * 1.5;

  private tween: Tween<any> | null = null;

  private danceLength = ARENA_DEFAULT_OBJECT_SIZE.SNAKE * 0.1;

  private mult = 1;

  private snakeShape = [
    {
      position: new Vec2(0, this.snakeSize * 4),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * 3),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
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
    },
    {
      position: new Vec2(0, this.snakeSize * -3),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
    {
      position: new Vec2(0, this.snakeSize * -4),
      radius: this.snakeSize,
      movementQueue: [],
      velocity: new Vec2(),
    },
  ];

  onLoad() {
    this.snakeRender?.setSnakeBody(this.snakeShape);
    let obj = { val: (Math.PI / 2) * this.mult * -1 };
    this.animDance(obj);
  }

  private animDance(obj: any) {
    this.tween = tween(obj)
      .to(
        0.5,
        { val: (Math.PI / 2) * this.mult },
        {
          onUpdate: () => {
            this.snakeShape?.forEach((body, idx) => {
              const modifier = idx % 2 === 0 ? 1 : -1;
              const sinVal = Math.sin(obj.val * modifier);

              body.position.set(sinVal * this.danceLength, body.position.y);
            });
          },
          onComplete: () => {
            this.mult *= -1;
            this.animDance(obj);
          },
          easing: "cubicIn",
        },
      )
      .start();
  }
}
