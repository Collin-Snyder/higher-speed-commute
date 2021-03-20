export default class PathQueue {
  public front: number;
  public end: number;
  public size: number;
  public storage: { [key: string]: any };
  constructor() {
    this.front = 0;
    this.end = -1;
    this.storage = {};
    this.size = 0;
  }

  put(square: ISquare) {
    this.end++;
    this.size++;
    this.storage[this.end] = square.id;
  }

  get() {
    if (this.empty()) return null;

    let oldFront = this.front;
    let output = this.storage[oldFront];

    this.front++;
    delete this.storage[oldFront];
    this.size--;

    return output;
  }

  empty() {
    return this.front > this.end;
  }
}
