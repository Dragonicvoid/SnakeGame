import { Component, Vec2 } from 'cc';

export interface FoodConfig {
  id: string;
  state: FoodState;
  gridIndex: number | undefined;
  object: Component;
}

export interface FoodState {
  position: Vec2;
  eaten: boolean;
}
