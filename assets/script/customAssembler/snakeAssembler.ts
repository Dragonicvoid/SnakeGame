import {
    _decorator, Component, gfx, IAssembler, MeshRenderData, Node, UITransform, Vec2, Vec3
} from 'cc';

import { SnakeRenderable } from '../customRenderable2D/snakeRenderable';

const { ccclass, property } = _decorator;

export const vfmtPosCoord = [
  new gfx.Attribute(gfx.AttributeName.ATTR_POSITION, gfx.Format.RGB32F),
  new gfx.Attribute("a_body_count", gfx.Format.R32F),
  new gfx.Attribute(gfx.AttributeName.ATTR_TEX_COORD, gfx.Format.RG32F),
  new gfx.Attribute("a_center", gfx.Format.RG32F),
  new gfx.Attribute("a_next_normal_pos", gfx.Format.RGB32F),
  new gfx.Attribute("a_prev_normal_pos", gfx.Format.RGB32F),
  new gfx.Attribute("a_next_pos", gfx.Format.RGB32F),
  new gfx.Attribute("a_prev_pos", gfx.Format.RGB32F),
];

@ccclass("SnakeAssembler")
export class SnakeAssembler implements IAssembler {
  createData(com: SnakeRenderable) {
    return MeshRenderData.add(vfmtPosCoord);
  }

  updateRenderData(com: SnakeRenderable) {}

  fillBuffers(com: SnakeRenderable, renderer: any) {
    const bodiesCount = com.snakesBody.length;

    let verticesCount = bodiesCount * 4;
    let indicesCount = bodiesCount * 6;

    // Request buffer for particles
    const renderData = <MeshRenderData>(<unknown>com.renderData);
    if (!renderData) return;

    renderData.reset();

    let vertexOffset = renderData.vertexCount;
    let indicesOffset = renderData.indexCount;
    renderData.request(verticesCount, indicesCount);
    const m = com.node.worldMatrix;

    const m00 = m.m00;
    const m01 = m.m01;
    const m02 = m.m02;
    const m03 = m.m03;
    const m04 = m.m04;
    const m05 = m.m05;
    const m06 = m.m06;
    const m07 = m.m07;
    const m12 = m.m12;
    const m13 = m.m13;
    const m14 = m.m14;
    const m15 = m.m15;

    const uiTrans = com.getComponent(UITransform);
    const halfUITrans: Vec2 = new Vec2(
      uiTrans ? uiTrans.width / 2 : 0,
      uiTrans ? uiTrans.height / 2 : 0,
    );

    // fill vertices
    const vbuf = renderData.vData!;
    for (let i = 0; i < bodiesCount; i++) {
      let x = com.snakesBody[i].position.x;
      let y = com.snakesBody[i].position.y;
      let r = com.snakesBody[i].radius;

      let prevXNorm: number | null = null;
      let prevYNorm: number | null = null;
      let unNormPrevXNorm = 0;
      let unNormPrevYNorm = 0;
      let prevR = com.snakesBody[i - 1]?.radius ?? 0;

      if (i - 1 >= 0 && i - 1 < bodiesCount)
      {
          const delta: Vec2 = new Vec2((com.snakesBody[i - 1].position.x - x) / prevR, (com.snakesBody[i - 1].position.y - y) / prevR);
          prevXNorm = delta.x;
          prevYNorm = delta.y;

          unNormPrevXNorm = delta.x;
          unNormPrevYNorm = delta.y;
      }

      let nextXNorm = null;
      let nextYNorm = null;
      let unNormNextXNorm = 0;
      let unNormNextYNorm = 0;
      let nextR = com.snakesBody[i + 1]?.radius ?? 0;
      if (i + 1 >= 0 && i + 1 < bodiesCount)
      {
          const delta:Vec2 = new Vec2((com.snakesBody[i + 1].position.x - x) / nextR, (com.snakesBody[i + 1].position.y - y) / nextR);
          nextXNorm = delta.x;
          nextYNorm = delta.y;

          unNormNextXNorm = delta.x;
          unNormNextYNorm = delta.y;
      }

      if (prevXNorm == null || prevYNorm == null)
      {
          const norm: Vec2 = new Vec2(x - com.snakesBody[i + 1].position.x, y - com.snakesBody[i + 1].position.y);
          norm.normalize();

          prevXNorm = norm.x * 0.1;
          prevYNorm = norm.y * 0.1;

          unNormPrevXNorm = norm.x;
          unNormPrevYNorm = norm.y;
      }
      else if (nextXNorm == null || nextYNorm == null)
      {
          const norm: Vec2 = new Vec2(x - com.snakesBody[i - 1].position.x, y - com.snakesBody[i - 1].position.y);
          norm.normalize();

          nextXNorm = norm.x * 0.1;
          nextYNorm = norm.y * 0.1;

          unNormNextXNorm = norm.x;
          unNormNextYNorm = norm.y;
      }

      const boxSize = r;

      // left-bottom
      vbuf[vertexOffset++] = x - boxSize + m12;
      vbuf[vertexOffset++] = y - boxSize + m13;
      vbuf[vertexOffset++] = r;
      vbuf[vertexOffset++] = bodiesCount - i;
      vbuf[vertexOffset++] = 0;
      vbuf[vertexOffset++] = 0;
      vbuf[vertexOffset++] = x;
      vbuf[vertexOffset++] = y;
      vbuf[vertexOffset++] = nextXNorm ?? 0;
      vbuf[vertexOffset++] = nextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = prevXNorm ?? 0;
      vbuf[vertexOffset++] = prevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;
      vbuf[vertexOffset++] = unNormNextXNorm ?? 0;
      vbuf[vertexOffset++] = unNormNextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = unNormPrevXNorm ?? 0;
      vbuf[vertexOffset++] = unNormPrevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;

      // right-bottom
      vbuf[vertexOffset++] = x + boxSize + m12;
      vbuf[vertexOffset++] = y - boxSize + m13;
      vbuf[vertexOffset++] = r;
      vbuf[vertexOffset++] = bodiesCount - i;
      vbuf[vertexOffset++] = 1;
      vbuf[vertexOffset++] = 0;
      vbuf[vertexOffset++] = x;
      vbuf[vertexOffset++] = y;
      vbuf[vertexOffset++] = nextXNorm ?? 0;
      vbuf[vertexOffset++] = nextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = prevXNorm ?? 0;
      vbuf[vertexOffset++] = prevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;
      vbuf[vertexOffset++] = unNormNextXNorm ?? 0;
      vbuf[vertexOffset++] = unNormNextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = unNormPrevXNorm ?? 0;
      vbuf[vertexOffset++] = unNormPrevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;

      // left-top
      vbuf[vertexOffset++] = x - boxSize + m12;
      vbuf[vertexOffset++] = y + boxSize + m13;
      vbuf[vertexOffset++] = r;
      vbuf[vertexOffset++] = bodiesCount - i;
      vbuf[vertexOffset++] = 0;
      vbuf[vertexOffset++] = 1;
      vbuf[vertexOffset++] = x;
      vbuf[vertexOffset++] = y;
      vbuf[vertexOffset++] = nextXNorm ?? 0;
      vbuf[vertexOffset++] = nextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = prevXNorm ?? 0;
      vbuf[vertexOffset++] = prevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;
      vbuf[vertexOffset++] = unNormNextXNorm ?? 0;
      vbuf[vertexOffset++] = unNormNextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = unNormPrevXNorm ?? 0;
      vbuf[vertexOffset++] = unNormPrevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;

      // right-top
      vbuf[vertexOffset++] = x + boxSize + m12;
      vbuf[vertexOffset++] = y + boxSize + m13;
      vbuf[vertexOffset++] = r;
      vbuf[vertexOffset++] = bodiesCount - i;
      vbuf[vertexOffset++] = 1;
      vbuf[vertexOffset++] = 1;
      vbuf[vertexOffset++] = x;
      vbuf[vertexOffset++] = y;
      vbuf[vertexOffset++] = nextXNorm ?? 0;
      vbuf[vertexOffset++] = nextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = prevXNorm ?? 0;
      vbuf[vertexOffset++] = prevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;
      vbuf[vertexOffset++] = unNormNextXNorm ?? 0;
      vbuf[vertexOffset++] = unNormNextYNorm ?? 0;
      vbuf[vertexOffset++] = nextR;
      vbuf[vertexOffset++] = unNormPrevXNorm ?? 0;
      vbuf[vertexOffset++] = unNormPrevYNorm ?? 0;
      vbuf[vertexOffset++] = prevR;
    }

    // fill indices
    const ibuf = renderData.iData!;
    for (let i = indicesOffset; i < bodiesCount; i++) {
      const vId = i * 4;
      ibuf[indicesOffset++] = vId;
      ibuf[indicesOffset++] = vId + 1;
      ibuf[indicesOffset++] = vId + 2;
      ibuf[indicesOffset++] = vId + 1;
      ibuf[indicesOffset++] = vId + 3;
      ibuf[indicesOffset++] = vId + 2;
    }
  }
}
