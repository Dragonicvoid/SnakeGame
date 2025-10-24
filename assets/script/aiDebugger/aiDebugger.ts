import {
    _decorator, CCFloat, Color, Component, EventTarget, Graphics, Label, math, Node
} from 'cc';

import {
    ARENA_DEFAULT_OBJECT_SIZE, ARENA_DEFAULT_VALUE, ARENA_OBJECT_TYPE
} from '../enum/arenaConfig';
import { Coordinate, TileMapData } from '../interface/map';
import { SnakeConfig } from '../interface/player';
import { convertCoorToArenaPos, convertPosToCoord } from '../util/arenaConvert';
import { shouldDrawMap, shouldDrawPathfinding } from '../util/query';

const { ccclass, property } = _decorator;

@ccclass("AIDebugger")
export class AIDebugger extends Component {
  @property(Graphics)
  view: Graphics | null = null;

  @property(CCFloat)
  updateTime = 1;

  @property(Color)
  pathColor: Color = Color.WHITE.clone();

  @property(Color)
  openListColor: Color = Color.WHITE.clone();

  @property(Color)
  closeListColor: Color = Color.WHITE.clone();

  @property(Color)
  occupyColor: Color = Color.WHITE.clone();

  @property(Color)
  freeColor: Color = Color.WHITE.clone();

  @property(Label)
  actionLabel?: Label;

  private player: SnakeConfig | null = null;

  private playerList: SnakeConfig[] = [];

  private map: TileMapData[][] = [];

  setupScheduler(): void {
    this.schedule(this.updateDraw, this.updateTime);
  }

  updateDraw() {
    this.view?.clear();
    this.drawPath();
    this.drawMap();
    this.updateLabel();
  }

  drawPath() {
    if (!this.view?.isValid || !this.player?.state.debugData) return;

    const drawPath = shouldDrawPathfinding();

    if (!drawPath) return;

    const path = this.player.state.debugData.enemyPath ?? [];
    path.forEach((p) => {
      this.drawTile(p);
    });

    const openList =
      this.player.state.debugData.pathfindingState?.openList ?? [];
    openList.forEach((o) => {
      const point = o.point;
      if (!point) return;
      this.drawTile(point, this.openListColor);
    });

    const closeList =
      this.player.state.debugData.pathfindingState?.closeList ?? [];
    closeList.forEach((c) => {
      const point = c.point;
      if (!point) return;
      this.drawTile(point, this.closeListColor);
    });
  }

  drawMap() {
    const ctx = this.view!;

    const drawMap = shouldDrawMap();

    if (!this.player || !drawMap) return;

    const { TILE } = ARENA_DEFAULT_OBJECT_SIZE;
    const head = this.player.state.body[0];

    if (!head) return;

    const headCoord = convertPosToCoord(head.position.x, head.position.y);

    const arenaWidth = ARENA_DEFAULT_VALUE.WIDTH;
    const arenaHeight = ARENA_DEFAULT_VALUE.HEIGHT;

    for (let y = 0; y < Math.floor(arenaHeight / TILE); y++) {
      for (let x = 0; x < Math.floor(arenaWidth / TILE); x++) {
        if (!this.map[y] || !this.map[y][x]) return;

        if (
          this.map[y][x].playerIDList.length > 0 ||
          this.map[y][x].type === ARENA_OBJECT_TYPE.SPIKE
        ) {
          ctx.strokeColor.set(this.occupyColor);
        } else {
          ctx.strokeColor.set(this.freeColor);
        }
        ctx.lineWidth = 4;
        ctx.circle(
          this.map[y][x].x + TILE / 2,
          this.map[y][x].y + TILE / 2,
          10,
        );
        ctx.stroke();
        ctx.close();
      }
    }
  }

  private drawTile(coord: Coordinate, color: Color = this.pathColor) {
    const ctx = this.view!;

    ctx.strokeColor.set(color);
    ctx.circle(coord.x, coord.y, 10);
    ctx.stroke();
    ctx.close();
  }

  public setPlayerToDebug(player: SnakeConfig | null) {
    this.player = player;
  }

  public setPlayerList(playerList: SnakeConfig[]) {
    this.playerList = playerList;
  }

  public setMapToDebug(map: TileMapData[][]) {
    this.map = map;
  }

  private updateLabel() {
    const actionData = new Map<string, number>();
    this.playerList.forEach((player) => {
      if (!player.action) return;

      const actionName = player.action?.mapKey;
      const data = actionData.get(player.action.mapKey);
      if (data !== undefined) {
        actionData.set(actionName, data + 1);
      } else {
        actionData.set(actionName, 1);
      }
    });

    let finalString = "";
    actionData.forEach((total, actionName) => {
      finalString += `${actionName} : ${total}\n`;
    });

    if (this.actionLabel) this.actionLabel.string = finalString;
  }

  onDestroy() {
    this.unscheduleAllCallbacks();
  }
}
