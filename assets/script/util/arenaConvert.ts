import { math, Vec2 } from "cc";

import {
  ARENA_DEFAULT_OBJECT_SIZE,
  ARENA_DEFAULT_VALUE,
} from "../enum/arenaConfig";
import { Coordinate } from "../interface/map";

export function convertCoorToArenaPos(x: number, y: number): Vec2 {
  const offset: Vec2 = new Vec2(
    ARENA_DEFAULT_VALUE.WIDTH / 2,
    ARENA_DEFAULT_VALUE.HEIGHT / 2,
  );

  const realPos = {
    x: x * ARENA_DEFAULT_OBJECT_SIZE.TILE + ARENA_DEFAULT_OBJECT_SIZE.TILE / 2,
    y: y * ARENA_DEFAULT_OBJECT_SIZE.TILE + ARENA_DEFAULT_OBJECT_SIZE.TILE / 2,
  };

  return new Vec2(realPos.x - offset.x, realPos.y - offset.y);
}

export function convertPosToCoord(x: number, y: number): Coordinate {
  const offset: Vec2 = new Vec2(
    ARENA_DEFAULT_VALUE.WIDTH / 2,
    ARENA_DEFAULT_VALUE.HEIGHT / 2,
  );
  const coord = {
    x: Math.floor((x + offset.x) / ARENA_DEFAULT_OBJECT_SIZE.TILE),
    y: Math.floor((y + offset.y) / ARENA_DEFAULT_OBJECT_SIZE.TILE),
  };

  return { x: coord.x, y: coord.y };
}

export function convertArenaPosToCoord(x: number, y: number): Coordinate {
  const offset: Vec2 = new Vec2(
    ARENA_DEFAULT_VALUE.WIDTH / 2,
    ARENA_DEFAULT_VALUE.HEIGHT / 2,
  );

  const coord = {
    x: Math.floor((x + offset.x) / ARENA_DEFAULT_OBJECT_SIZE.TILE),
    y: Math.floor((y + offset.y) / ARENA_DEFAULT_OBJECT_SIZE.TILE),
  };

  return { x: coord.x, y: coord.y };
}

export function getGridIdxByPos(pos: Coordinate) {
  let currIdx = -1;

  const offset = {
    x: ARENA_DEFAULT_VALUE.WIDTH / 2,
    y: ARENA_DEFAULT_VALUE.HEIGHT / 2,
  };

  const maxRow = Math.ceil(
    ARENA_DEFAULT_VALUE.WIDTH / ARENA_DEFAULT_VALUE.GRID_WIDTH,
  );
  const currX = Math.floor(
    math.clamp(pos.x + offset.x, 0, ARENA_DEFAULT_VALUE.WIDTH) /
      ARENA_DEFAULT_VALUE.GRID_WIDTH,
  );
  const currY = Math.floor(
    math.clamp(pos.y + offset.y, 0, ARENA_DEFAULT_VALUE.HEIGHT) /
      ARENA_DEFAULT_VALUE.GRID_HEIGHT,
  );
  currIdx = currY * maxRow + currX;
  if (currIdx < 0) return undefined;

  return currIdx;
}
