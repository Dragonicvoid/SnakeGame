import { Enum } from "cc";

export enum PHYSICS_GROUP {
  DEFAULT = 1 << 0,
  FOOD = 1 << 1,
  PLAYER = 1 << 2,
  FOOD_GRABBER = 1 << 3,
  OBSTACLE = 1 << 4,
  ENEMY = 1 << 5,
  PLAYER_BODIES = 1 << 6,
  ENEMY_BODIES = 1 << 7,
}

Enum(PHYSICS_GROUP);
