import { Component, Vec3 } from "cc";

export interface FoodConfig {
  id: string;
  state: FoodState;
  gridIndex: number | undefined;
  object: Component;
}

export interface FoodState {
  position: Vec3;
  eaten: boolean;
}
