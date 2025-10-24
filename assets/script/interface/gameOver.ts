import { DIFFICULTY } from "../enum/difficulty";
import { SnakeConfig } from "./player";

export interface GameOverData {
  player?: SnakeConfig;
  enemy?: SnakeConfig;
  time: number;
  diff: DIFFICULTY;
  isWon: boolean;
}
