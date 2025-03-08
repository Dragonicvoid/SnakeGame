import { Vec2, Vec3 } from "cc";
import { FoodConfig } from "./food";
import { SnakeConfig } from "./player";

export interface PlannerFactor {
  player: SnakeConfig;
  playerList: SnakeConfig[];

  // This are in form of angle
  detectedPlayer: number[];
  detectedWall: number[];
  detectedFood?: FoodConfig;

  currCoord: Vec3;
  // TODO update with Grid interface
  gridWithMostFood: any;
  listOfAvailableGrid: any;
}
