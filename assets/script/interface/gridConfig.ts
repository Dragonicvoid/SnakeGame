import { Sprite, Vec3 } from "cc";
import { FoodConfig } from "./food";

export type GridConfig = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  midX: number;
  midY: number;
  foods: FoodConfig[];
  spikes: SpikeConfig[];
  chickBodies: Map<string, number>;
};

export type SpikeConfig = {
  sprite: Sprite;
  gridIndex: number;
  position: Vec3;
};
