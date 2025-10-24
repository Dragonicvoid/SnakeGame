import { Node, Sprite, Vec2 } from "cc";

export interface XY {
  x: number;
  y: number;
}

export interface ObstacleData {
  parent: Node | null;
  position: Vec2;
  dimension: Vec2;
  targetOpacity: number;
  obj?: Node;
}

export interface SpritePool {}
