import { Component, Vec2, Vec3 } from "cc";
import { Movement } from "./gameplay";
import { BOT_ACTION } from "../enum/botAction";
import { BaseAction } from "../action/baseAction";
import { FoodConfig } from "./food";
import { PlayerManager } from "../manager/playerManager";
import { ArenaManager } from "../manager/ArenaManager";
import { FoodManager } from "../manager/foodManager";

export interface SnakeConfig {
    id: string,
    state: SnakeState;
    movementDirection: Movement,
    isBot: boolean,
    isAlive: boolean,
    possibleActions: Map<BOT_ACTION, BaseAction>,
    action: BaseAction | undefined,
}

export interface SnakeState {
    body: SnakeBody[];
    velocity: Vec2,
    inDirectionChange: boolean,
    targetFood: {
        food: FoodConfig,
        timeTargeted: number,
    },
}

export interface SnakeBody {
    position: Vec3,
}

export interface SnakeActionData<T = any> {
    manager: Partial<ManagerActionData>,
    detectedFood: FoodConfig,
    detectedPlayer: number[],
    detectedWall: number[],
    config?: any,
}

export interface ManagerActionData {
    playerManager: PlayerManager,
    arenaManager: ArenaManager,
    foodManager: FoodManager,
}