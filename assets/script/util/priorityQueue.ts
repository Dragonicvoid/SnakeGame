import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PriorityQueue')
export class PriorityQueue<T = number> {
  public items: T[] = [];

  public comparator: (a: T, b: T) => boolean = (a: T, b: T) => {
    return a > b;
  };

  constructor(comparator: (a: T, b: T) => boolean, items: T[] = []) {
    this.items = items;
    this.comparator = comparator;
  }

  public size() {
    return this.items.length;
  }

  public isEmpty() {
    return this.size() === 0;
  }

  public enqueue(values: T[]) {
    values.forEach((value) => {
      this.placeValue(value);
    });
    return this.size();
  }

  private placeValue(value: T) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.comparator(value, this.items[i])) {
        this.items.splice(i, 0, value);
        return;
      }
    }

    this.items.push(value);
  }

  public dequeue() {
    const poppedValue = this.items.shift();
    return poppedValue;
  }
}
