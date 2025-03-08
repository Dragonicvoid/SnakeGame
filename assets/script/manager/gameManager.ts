import { _decorator, Component, Node } from 'cc';
import { ARENA_DEFAULT_OBJECT_SIZE } from '../enum/arenaConfig';
import { SnakeConfig } from '../interface/player';
import { ArenaManager } from './ArenaManager';
import { PlayerManager } from './playerManager';
import { FoodManager } from './foodManager';
import { BotPlanner } from '../util/botPlanner';
import { FoodConfig } from '../interface/food';
import { BOT_CONFIG } from '../enum/botConfig';
import { PlannerFactor } from '../interface/ai';
import { BaseAction } from '../action/baseAction';
import { GridManager } from './gridManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(ArenaManager)
    private arenaManager: ArenaManager | null = null;

    @property(GridManager)
    private gridManager: GridManager | null = null;

    @property(PlayerManager)
    private playerManager: PlayerManager | null = null;

    @property(FoodManager)
    private foodManager: FoodManager | null = null;

    @property(BotPlanner)
    private planner: BotPlanner | null = null;

    private handleBotLogic(
        player: SnakeConfig,
        skipTurnRadius = false,
      ) {
        if (!skipTurnRadius) return;
    
        if (!player.isBot) return;
    
        if (
          !this.playerManager?.isValid ||
          !this.arenaManager?.isValid ||
          !this.foodManager?.isValid ||
          !this.planner
        )
          return;
    
        let detectedPlayer: Array<number> = [];
        let detectedWall: Array<number> = [];
        let detectedFood: FoodConfig | undefined;
        //handle bot Booster Activation
        // this.processBotBoosterUsage(player);
    
        //if bot in the middle of turning sequene, disable the turn logic
        if (player.state.inDirectionChange === true && !skipTurnRadius) return;
        //detect player and food
        detectedPlayer = this.playerManager.findNearestPlayerTowardPoint(
          player,
          BOT_CONFIG.TRIGGER_AREA_DST,
        );
    
        detectedWall = this.arenaManager.findNearestObstacleTowardPoint(
          player,
          BOT_CONFIG.TRIGGER_AREA_DST,
        );
    
        // need to updated to adjust botData
        let targetFood = player.state.targetFood;
        if (detectedPlayer.length < 1 && !targetFood) {
          detectedFood = this.arenaManager.getNearestDetectedFood(
            player,
            BOT_CONFIG.TRIGGER_AREA_DST,
          );
        }
    
        if (detectedFood) {
          targetFood = {
            food: detectedFood,
            timeTargeted: Date.now(),
          };
        }
    
        if (targetFood) {
          const targetExist = this.foodManager.foodList.find(
            (item) => item.id === targetFood.food.id,
          );
          const targetIsEaten = targetFood.food.state.eaten;
          const isExpired = Date.now() - targetFood.timeTargeted > 3000;
          // player.serverPlayerData.botData = {
          //   targetFood: undefined,
          // };
          if (!targetExist || targetIsEaten || isExpired) {
            player.state.targetFood = undefined;
          }
        }
    
        const currState = player.state.body[0];
    
        const gridWithMostFood = this.arenaManager?.getGridWithMostFood();
    
        const factor: PlannerFactor = {
          detectedPlayer: detectedPlayer,
          detectedWall: detectedWall,
          detectedFood: detectedFood,
          currCoord: currState.position,
          gridWithMostFood: gridWithMostFood,
          listOfAvailableGrid: this.gridManager.gridList ?? [],
          playerList: this.playerManager.playerList,
          player: player,
        };
        const possibleActions: BaseAction[] = [];
        player.possibleActions.forEach((action) => {
          possibleActions.push(action);
        });
        const currAction = this.planner.plan(possibleActions, factor);
    
        const differentAction = currAction !== player.action;
        if (currAction && player.action?.allowToChange()) {
          if (differentAction) {
            player.action?.onChange();
          }
    
          player.action = currAction;
    
          if (differentAction) {
            currAction.init();
          }
        }
    
        player.action?.run(player, {
          manager: {
            arenaManager: this.arenaManager,
            foodManager: this.foodManager,
            playerManager: this.playerManager,
          },
          detectedFood: detectedFood,
          detectedPlayer: detectedPlayer,
          detectedWall: detectedWall,
        });
    
        // if (shouldDebug()) {
        //   const possibleActions = player.serverPlayerData.possibleActions;
        //   player.playerState.debugData = {
        //     actionName: player.serverPlayerData.action?.mapKey,
        //     enemyID: player.playerState.id,
        //     enemyPath: player.serverPlayerData.action?.path,
        //     pathfindingState: player.serverPlayerData.action?.prevPathfindingData,
        //     opponentSetting: player.serverPlayerData.botData?.opponentSetting,
        //     possibleActions: possibleActions,
        //   };
        // }
      }
}


