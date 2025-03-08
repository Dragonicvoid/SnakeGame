import { _decorator, Component, Node } from 'cc';
import { FoodConfig } from '../interface/food';
const { ccclass, property } = _decorator;

@ccclass('FoodManager')
export class FoodManager extends Component {
    public foodList: FoodConfig[] = [];
}


