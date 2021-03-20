export default class Square implements ISquare {
  public drivable: boolean;
  public borders: TBorders;
  public schoolZone: boolean;
  public coordinates: { X: number; Y: number };
  public tileIndex: number;
  constructor(public id: number, public row: number, public column: number) {
    this.drivable = false;
    this.schoolZone = false;
    this.borders = { up: null, down: null, left: null, right: null };
    this.coordinates = { X: (column - 1) * 25, Y: (row - 1) * 25 };
    this.tileIndex = this.id - 1;
  }
}
