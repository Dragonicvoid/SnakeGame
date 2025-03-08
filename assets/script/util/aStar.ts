import { Component, Vec2, _decorator } from "cc";
import {
  ARENA_DEFAULT_OBJECT_SIZE,
  ARENA_OBJECT_TYPE,
} from "../enum/arenaConfig";
import { Coordinate, TileMapData } from "../interface/map";
const { ccclass, property } = _decorator;

export class AStarPoint {
  public point: Coordinate | null = null;
  public prevPoint: AStarPoint | null = null;
  public currGoal: number = 0;
  public currHeuristic: number = 0;

  get currF() {
    return this.currGoal + this.currHeuristic;
  }

  constructor(origin: Coordinate, target: Coordinate) {
    this.currHeuristic = getDistance(origin, target);
    this.point = origin;
  }
}

export interface AStarResultData {
  result: Array<Coordinate>;
  data?: AStarSearchData;
}

export interface AStarSearchData {
  openList: Array<AStarPoint>;
  closeList: Array<AStarPoint>;
  memoiPoint: Map<string, AStarPoint>;
  pathFound: AStarPoint | null;
}

@ccclass("AStar")
export class AStar extends Component {
  private map: TileMapData[][] = [];

  private padding = 1;

  private currID = "";

  public setMap(map: TileMapData[][]) {
    this.map = map;
  }

  public search(
    origin: Coordinate,
    target: Coordinate,
    prevData: AStarSearchData,
    id: string,
    predefinedPath: Coordinate[] = [],
    maxDepth: number = 10,
  ): AStarResultData {
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const offset = TILE / 2;
    let currDepth = 0;
    this.currID = id;

    if (prevData.openList.length <= 0) {
      const aStarPoint = new AStarPoint(origin, target);
      prevData.openList.push(aStarPoint);
      prevData.memoiPoint.set(getStringCoordName(origin), aStarPoint);
    }

    while (prevData.openList.length > 0 && !prevData.pathFound) {
      let lowestFIdx = 0;
      for (let j = 0; j < prevData.openList.length; j++) {
        if (prevData.openList[j].currF < prevData.openList[lowestFIdx].currF) {
          lowestFIdx = j;
        }
      }
      let currentPoint = prevData.openList[lowestFIdx];

      // found path
      if (
        (currentPoint.point && getDistance(currentPoint.point, target) <= 55) ||
        currDepth >= maxDepth
      ) {
        if (
          currentPoint.point &&
          getDistance(currentPoint.point, target) <= 55
        ) {
          prevData.pathFound = currentPoint;
        }

        let curr: AStarPoint = JSON.parse(JSON.stringify(currentPoint));
        let result: Coordinate[] = [];
        while (curr.prevPoint && curr.point) {
          curr.point.x += offset;
          curr.point.y += offset;
          result.push(curr.point);
          curr = JSON.parse(JSON.stringify(curr.prevPoint));
        }

        result.reverse();
        result.push(...predefinedPath);
        result = sliceByPosition(result, origin);
        return { result, data: prevData };
      }

      prevData.openList = prevData.openList.filter((el) => {
        return (
          el.point?.x !== currentPoint.point?.x ||
          el.point?.y !== currentPoint.point?.y
        );
      });
      prevData.closeList.push(currentPoint);
      const neighbor = currentPoint.point
        ? this.getNeighbor(currentPoint.point)
        : [];

      for (let i = 0; i < neighbor.length; i++) {
        // already visited
        if (
          prevData.closeList.find(
            (el) =>
              el.point &&
              getStringCoordName(neighbor[i]) === getStringCoordName(el.point),
          )
        ) {
          continue;
        }

        let gScore =
          currentPoint.currGoal +
          this.getCoordCost(neighbor[i]) +
          (currentPoint.point
            ? getDistance(currentPoint.point, neighbor[i])
            : 0);
        let gScoreIsBest = false;

        let currNeighbor = prevData.memoiPoint.get(
          getStringCoordName(neighbor[i]),
        );

        if (!prevData.openList.find((el) => neighbor[i] === el.point)) {
          // new node
          currNeighbor = new AStarPoint(neighbor[i], target);
          prevData.memoiPoint.set(
            getStringCoordName(neighbor[i]),
            currNeighbor,
          );
          prevData.openList.push(currNeighbor);
          gScoreIsBest = true;
        } else if (currNeighbor && gScore < currNeighbor.currGoal) {
          // visited node, but with better goal;
          gScoreIsBest = true;
        }

        if (currNeighbor && gScoreIsBest) {
          currNeighbor.prevPoint = currentPoint;
          currNeighbor.currGoal = gScore;
          currNeighbor.currHeuristic = currNeighbor.point
            ? Math.pow(getDistance(currNeighbor.point, target), 2)
            : currNeighbor.currHeuristic;
        }
      }

      currDepth++;
    }

    if (prevData.pathFound) {
      let curr: AStarPoint = JSON.parse(JSON.stringify(prevData.pathFound));
      let result: Coordinate[] = [];
      while (curr.prevPoint && curr.point) {
        curr.point.x += offset;
        curr.point.y += offset;
        result.push(curr.point);
        curr = JSON.parse(JSON.stringify(curr.prevPoint));
      }

      result.reverse();
      result.push(...predefinedPath);
      result = sliceByPosition(result, origin);
      return { result, data: prevData };
    }

    console.log("NO PATH");
    return { result: [], data: prevData };
  }

  private getNeighbor(coord: Coordinate) {
    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const { x, y } = getIdxByCoord(coord);
    const result: Coordinate[] = [];

    // Left, Right, Up, Down
    if (this.isValidPosition(x + this.padding, y)) {
      result.push({
        x: (x + this.padding) * TILE,
        y: y * TILE,
      });
    }

    if (this.isValidPosition(x - this.padding, y)) {
      result.push({
        x: (x - this.padding) * TILE,
        y: y * TILE,
      });
    }

    if (this.isValidPosition(x, y + this.padding)) {
      result.push({
        x: x * TILE,
        y: (y + this.padding) * TILE,
      });
    }

    if (this.isValidPosition(x, y - this.padding)) {
      result.push({
        x: x * TILE,
        y: (y - this.padding) * TILE,
      });
    }

    // Diagonal
    if (
      this.isValidPosition(x + this.padding, y + this.padding) &&
      this.isValidPosition(x + this.padding, y) &&
      this.isValidPosition(x, y + this.padding)
    ) {
      result.push({
        x: (x + this.padding) * TILE,
        y: (y + this.padding) * TILE,
      });
    }

    if (
      this.isValidPosition(x - this.padding, y + this.padding) &&
      this.isValidPosition(x - this.padding, y) &&
      this.isValidPosition(x, y + this.padding)
    ) {
      result.push({
        x: (x - this.padding) * TILE,
        y: (y + this.padding) * TILE,
      });
    }

    if (
      this.isValidPosition(x - this.padding, y - this.padding) &&
      this.isValidPosition(x - this.padding, y) &&
      this.isValidPosition(x, y - this.padding)
    ) {
      result.push({
        x: (x - this.padding) * TILE,
        y: (y - this.padding) * TILE,
      });
    }

    if (
      this.isValidPosition(x + this.padding, y - this.padding) &&
      this.isValidPosition(x + this.padding, y) &&
      this.isValidPosition(x, y - this.padding)
    ) {
      result.push({
        x: (x + this.padding) * TILE,
        y: (y - this.padding) * TILE,
      });
    }

    return result;
  }

  private isValidPosition(
    idxX: number,
    idxY: number,
    depth: number = 1,
  ): boolean {
    let neighbor = true;
    if (depth > 0) {
      depth--;
      neighbor =
        this.isValidPosition(idxX - 1, idxY, depth) &&
        this.isValidPosition(idxX - 1, idxY + 1, depth) &&
        this.isValidPosition(idxX, idxY + 1, depth) &&
        this.isValidPosition(idxX + 1, idxY + 1, depth) &&
        this.isValidPosition(idxX + 1, idxY, depth) &&
        this.isValidPosition(idxX + 1, idxY - 1, depth) &&
        this.isValidPosition(idxX, idxY - 1, depth) &&
        this.isValidPosition(idxX - 1, idxY - 1, depth);
    }

    if (this.map[idxX] === undefined || this.map[idxX][idxY] === undefined)
      return false;

    const safeObstacle = this.map[idxX][idxY].type !== ARENA_OBJECT_TYPE.SPIKE;

    const occupyByOther = this.map[idxX][idxY].playerIDList.find(
      (id) => id !== this.currID,
    );

    return safeObstacle && occupyByOther === undefined && neighbor;
  }

  private getCoordCost(coord: Coordinate) {
    const { x, y } = getIdxByCoord(coord);
    if (!this.map[x] || !this.map[x][y]) return 1;

    switch (this.map[x][y].type) {
      case ARENA_OBJECT_TYPE.NONE:
        return 1;
      default:
        return 1;
    }
  }
}

export function getStringCoordName(coord: Coordinate) {
  const { x, y } = getIdxByCoord(coord);
  const result = "Coord_" + x + "_" + y;
  return result;
}

export function getIdxByCoord(coord: Coordinate) {
  const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
  const idxX = Math.floor(coord.x / TILE);
  const idxY = Math.floor(coord.y / TILE);

  return {
    x: idxX,
    y: idxY,
  };
}

export function sliceByPosition(
  result: Array<Coordinate>,
  currPos: Coordinate,
) {
  let sliceIdx = 0;
  let closestDist = Number.MAX_VALUE;
  let lastClosestCoord: Coordinate | null = null;
  for (let i = 0; i < result.length; i++) {
    const currTile = result[i];
    const currDist = getDistance(currTile, currPos);

    if (currDist < closestDist) {
      lastClosestCoord = currTile;
      closestDist = currDist;
      sliceIdx = i + 1;
    }

    // If its too far then it is no way a path can be shorter
    // if (lastClosestCoord && getDistance(lastClosestCoord, currTile) > 100)
    //   break;
  }

  return result.slice(sliceIdx);
}

export function getDistance(origin: Coordinate, target: Coordinate) {
  return Vec2.distance(origin, target);
}
