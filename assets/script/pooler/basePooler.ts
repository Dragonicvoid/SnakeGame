import { _decorator, CCInteger, Component, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BasePooler')
export class BasePooler extends Component {
    @property(Node)
    private parent: Node | null = null;

    @property(Prefab)
    private food: Prefab | null = null;

    @property(CCInteger)
    private initial: number = 20;

    private pool : Node[] = [];

    protected onLoad(): void {
        if (!this.parent?.isValid) {
            this.parent = this.node;
        }
    }

    protected start(): void {
        for(let i = 0; i < this.initial; i++) {
            this.createNew();
        }
    }

    public getNode(): Node | null {
        if (this.pool.length <= 0 ) {
            this.createNew();
        }

        const obj = this.pool.pop();

        if (!obj?.isValid) return null;

        return obj;
    }

    private createNew(): Node | null {
        if (!this.food?.isValid) return null;

        const obj = instantiate(this.food);
        this.returnNode(obj);

        return obj;
    }

    public returnNode(node: Node | null) {
        if (!node?.isValid) return;

        node.active = false;
        node.parent = this.parent;
        this.pool.push(node);
    }
}


