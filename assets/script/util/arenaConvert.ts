import { math, Vec2 } from "cc";
import { ARENA_DEFAULT_VALUE } from "../enum/arenaConfig";
import { Coordinate } from "../interface/map";

export function convertToArenaPos(x: number, y: number): Vec2 {
    const offset: Vec2 = new Vec2(ARENA_DEFAULT_VALUE.WIDTH / 2, ARENA_DEFAULT_VALUE.HEIGHT / 2);

    return new Vec2(x - offset.x, y - offset.y);
}

export function getGridIdxByCoord(coord: Coordinate) {
    let currIdx = -1;

    const offset = {
        x: ARENA_DEFAULT_VALUE.WIDTH / 2,
        y: ARENA_DEFAULT_VALUE.HEIGHT / 2,
    }

    const maxRow = Math.ceil(ARENA_DEFAULT_VALUE.WIDTH / ARENA_DEFAULT_VALUE.GRID_WIDTH);
    const currX = Math.floor(
        math.clamp(coord.x + offset.x, 0, ARENA_DEFAULT_VALUE.WIDTH) / ARENA_DEFAULT_VALUE.GRID_WIDTH,
    );
    const currY = Math.floor(
        math.clamp(coord.y + offset.y, 0, ARENA_DEFAULT_VALUE.HEIGHT) /
        ARENA_DEFAULT_VALUE.HEIGHT,
    );
    currIdx = currY * maxRow + currX;
    if (currIdx < 0) return undefined;

    return currIdx;
}