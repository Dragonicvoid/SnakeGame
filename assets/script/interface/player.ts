import { Component, Vec2, Vec3 } from "cc";
import { Movement } from "./gameplay";
import { BOT_ACTION } from "../enum/botAction";
import { BaseAction } from "../action/baseAction";
import { FoodConfig } from "./food";
import { PlayerManager } from "../manager/playerManager";
import { ArenaManager } from "../manager/ArenaManager";
import { FoodManager } from "../manager/foodManager";
import { Coordinate } from "./map";
import { AStarSearchData } from "../util/aStar";

export interface SnakeConfig {
  id: string;
  state: SnakeState;
  movementDirection: Movement;
  isBot: boolean;
  isAlive: boolean;
  possibleActions: Map<BOT_ACTION, BaseAction>;
  action: BaseAction | undefined;
}

export interface SnakeState {
  body: SnakeBody[];
  velocity: Vec2;
  inDirectionChange: boolean;
  debugData?: SnakeDebugData;
  targetFood?: {
    food: FoodConfig;
    timeTargeted: number;
  };
}

export interface SnakeBody {
  position: Vec3;
  radius: number
}

export interface SnakeActionData<T = any> {
  manager: Partial<ManagerActionData>;
  detectedFood?: FoodConfig;
  detectedPlayer: number[];
  detectedWall: number[];
  config?: any;
}

export interface ManagerActionData {
  playerManager: PlayerManager;
  arenaManager: ArenaManager;
  foodManager: FoodManager;
}

export interface SnakeDebugData {
  enemyID?: string;
  actionName?: string;
  enemyPath?: Coordinate[];
  pathfindingState?: AStarSearchData;
  possibleActions?: Map<BOT_ACTION, BaseAction>;
}
