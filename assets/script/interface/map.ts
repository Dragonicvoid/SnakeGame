import { ARENA_OBJECT_TYPE } from "../enum/arenaConfig";

export interface Coordinate {
    x: number,
    y: number,
}

export interface TileMapData {
    x: number,
    y: number,
    gridX: number,
    gridY: number,
    type: ARENA_OBJECT_TYPE,
    playerIDList: string[],
}