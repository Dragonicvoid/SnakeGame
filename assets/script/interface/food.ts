import { Component, Node, Vec2 } from 'cc';

export interface FoodConfig {
  id: string;
  state: FoodState;
  gridIndex: number | undefined;
  object: Node;
}

export interface FoodState {
  position: Vec2;
  eaten: boolean;
}
