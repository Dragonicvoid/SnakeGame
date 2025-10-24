import { Component, Node, Vec2, Vec3 } from 'cc';

import { BaseAction } from '../action/baseAction';
import { SnakeRenderable } from '../customRenderable2D/snakeRenderable';
import { BOT_ACTION } from '../enum/botAction';
import { SnakeType } from '../enum/snakeType';
import { ArenaManager } from '../manager/ArenaManager';
import { FoodManager } from '../manager/foodManager';
import { PlayerManager } from '../manager/playerManager';
import { AStarSearchData } from '../util/aStar';
import { FoodConfig } from './food';
import { Coordinate } from './map';
import { XY } from './other';
import { SkinDetail } from './skinList';

export interface SnakeConfig {
  id: string;
  state: SnakeState;
  isBot: boolean;
  isAlive: boolean;

  render?: SnakeRenderable | null;
  possibleActions?: Map<BOT_ACTION, BaseAction>;
  action?: BaseAction;
}

export interface SnakeState {
  foodGrabber: FoodGrabber;
  body: SnakeBody[];
  // this is target Vec2 direction doesn't mean its
  // actual current direction in the game
  movementDir: Vec2;
  inputDirection: Vec2;
  speed: number;
  coordName: string;
  inDirectionChange: boolean;
  debugData?: SnakeDebugData;
  targetFood?: {
    food: FoodConfig;
    timeTargeted: number;
  };
}

export interface SnakeBody {
  position: Vec2;
  radius: number;
  movementQueue: XY[];
  // actual current direction in the game
  velocity: Vec2;
  obj?: Node;
}

export interface FoodGrabber {
  position: Vec2;
  radius: number;
  obj?: Node;
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
  possibleActions?: BaseAction[];
}

export interface SnakeTypeAndSkin {
  skin?: SkinDetail;
  type: SnakeType;
}
