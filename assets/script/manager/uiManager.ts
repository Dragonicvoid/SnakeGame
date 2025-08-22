import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Node)
    startUI: Node | null = null;

    public showStartUI(val = true) {
        if (!this.startUI?.isValid) return;
        
        this.startUI.active = val;
    }
}


