export function getQueryParam(param: string) {
  const url = new URL(window.location.href);
  return url.searchParams.get(param);
}

export function shouldDebug() {
  return getQueryParam("debug") === "true";
}

export function shouldDrawPathfinding() {
  return getQueryParam("drawPathfinding") === "true";
}

export function shouldDrawMap() {
  return getQueryParam("drawMap") === "true";
}

export function shouldDebugAction() {
  return getQueryParam("debugAction") === "true";
}

export function shouldDebugCone() {
  return getQueryParam("debugCone") === "true";
}
