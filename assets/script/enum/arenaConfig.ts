export enum ARENA_DEFAULT_VALUE {
  WIDTH = 700,
  HEIGHT = 700,

  GRID_WIDTH = 100,
  GRID_HEIGHT = 100,
}

export enum ARENA_DEFAULT_OBJECT_SIZE {
  FOOD = 10,
  SPIKE = 20,
  SNAKE = 20,
  TILE = 20,
  FOOD_GRABBER = 30,
}

export enum ARENA_OBJECT_TYPE {
  NONE = 1 << 0,
  FOOD = 1 << 1,
  WALL = 1 << 2,
  SPIKE = 1 << 3,
  SNAKE = 1 << 4,
  SPAWN_POINT = 1 << 5,
}
