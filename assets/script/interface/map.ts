import { ARENA_OBJECT_TYPE } from "../enum/arenaConfig";

export interface Coordinate {
  x: number;
  y: number;
}

export interface TileMapData {
  x: number;
  y: number;
  gridIdx?: number;
  type: ARENA_OBJECT_TYPE;
  playerIDList: string[];
}

export interface LevelMapData {
  row: number; // horizontally
  col: number; // vertical
  maps: number[];
}
