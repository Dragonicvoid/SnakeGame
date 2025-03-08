import { _decorator, Component, Node, random, Vec2 } from 'cc';
import { BasePooler } from '../pooler/basePooler';
import { ARENA_DEFAULT_VALUE } from '../enum/arenaConfig';
import { convertToArenaPos } from '../util/arenaConvert';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('FoodSpawner')
export class FoodSpawner extends Component {
    @property(Node)
    private parent: Node | null = null;

    @property(BasePooler)
    private pooler: BasePooler | null = null;

    protected onLoad(): void {
        if(!this.parent?.isValid) {
            this.parent = this.node;
        }
    }

    protected start(): void {
        for(let i = 0; i < 10; i++) {
            this.spawn();
        }
    }

    public removeFood(node: Node) {
        this.pooler.returnNode(node);
    }

    public spawn() {
        // TODO get Position 
        const targetPos: Vec2 = convertToArenaPos(Math.random() * ARENA_DEFAULT_VALUE.WIDTH, Math.random() * ARENA_DEFAULT_VALUE.HEIGHT);
        
        const food = this.pooler.getNode();

        if (!food?.isValid) return;

        food.parent = this.parent;
        food.setPosition(targetPos.x, targetPos.y);
        food.active = true;

        // DEBUG
        this.scheduleOnce(() => {
            this.spawn();
            this.removeFood(food);
        }, 0.5);
    }
}


