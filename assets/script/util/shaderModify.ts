import { EffectAsset, Material, murmurhash2_32_gc, rendering } from "cc";

import { SnakeType } from "../enum/snakeType";

const defaultFragShad =
  "vec4 getTexture(vec2 uv) {\n\treturn texture(mainTexture, uv);\n}";

// Basically add another Effect to Cocos
// instead of doing it in editor
export function modifyFragShader(
  mat: Material,
  textureCode: string = defaultFragShad,
  snakeType?: string,
  skinType?: string,
) {
  // Need to use effectAsset.name instead, since using mat.effectName
  // is not reliable (it does not inserted if you instantiate with effectAsset)
  // @ts-ignore
  const oldEffect = EffectAsset.get(mat.effectAsset?._name ?? "");
  const effectAsset = JSON.parse(JSON.stringify(oldEffect)) as EffectAsset;
  const shaderInfo = effectAsset?.shaders[0];
  const shaderTech = effectAsset?.techniques[0];

  if (!shaderInfo || !shaderTech) return;

  const regexShadName = /[^|]*/;
  const regexFragShad = /vec4 getTexture[^}]*}/;

  const shaderName = shaderInfo.name.match(regexShadName);

  shaderInfo.name = shaderInfo.name.replace(
    regexShadName,
    shaderName?.[0] + `_${snakeType}_${skinType}`,
  );
  shaderTech.passes[0].program = shaderInfo.name.replace(
    regexShadName,
    shaderName?.[0] + `_${snakeType}_${skinType}`,
  );

  const programLib = rendering.programLib as any;

  shaderInfo.glsl1.frag = shaderInfo.glsl1.frag.replace(
    regexFragShad,
    textureCode,
  );
  shaderInfo.glsl3.frag = shaderInfo.glsl3.frag.replace(
    regexFragShad,
    textureCode,
  );
  shaderInfo.glsl4.frag = shaderInfo.glsl4.frag.replace(
    regexFragShad,
    textureCode,
  );

  const newHash = murmurhash2_32_gc(
    shaderInfo.name + shaderInfo.glsl1.frag + shaderInfo.glsl1.vert,
    666,
  );
  shaderInfo.hash = newHash;

  programLib.addEffect(effectAsset);

  const newMat = new Material();
  // @ts-ignore
  newMat.initialize({
    effectAsset: effectAsset,
  });

  return newMat;
}

export function getEffectFromSnakeType(snakeType: SnakeType): {
  resourceName: string;
  effectName: string;
} {
  switch (snakeType) {
    case SnakeType.NORMAL:
      return {
        resourceName: "effect/snakeRender",
        effectName: "../resources/effect/snakeRender",
      };
    case SnakeType.FIRE:
      return {
        resourceName: "effect/snakeRender",
        effectName: "../resources/effect/snakeRender",
      };
    case SnakeType.WATER:
      return {
        resourceName: "effect/snakeRender",
        effectName: "../resources/effect/snakeRender",
      };
  }
}
