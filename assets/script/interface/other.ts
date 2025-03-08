import { Node, Sprite, Vec2 } from "cc";

export interface XY {
    x: number,
    y: number,
}

export interface ObstacleSpriteRef {
    parent: Node | null,
    position: Vec2,
    dimension: Vec2,
    targetOpacity: number,
    sprite?: Sprite,
}

export interface SpritePool {

}