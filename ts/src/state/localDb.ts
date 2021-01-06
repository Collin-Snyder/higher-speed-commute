import Dexie from "dexie";
import { ISquare, Direction } from "./map";

export class LocalDB extends Dexie {
  userMaps: Dexie.Table<UserMap>;

  constructor() {
    super("LocalDB");

    this.version(1).stores({
      userMaps: "++id, &name",
    });

    this.userMaps = this.table("userMaps");
  }
}

interface IUserMap {
  id?: number;
  name: string;
  boardHeight: number;
  boardWidth: number;
}

const db = new LocalDB();

export class UserMap implements IUserMap {
  id?: number;
  public boardHeight: number;
  public boardWidth: number;

  constructor(
    public name: string,
    public playerHome: number,
    public bossHome: number,
    public office: number,
    public squares: ISquare[],
    public lights: { [squareId: string]: number },
    public coffees: { [squareId: string]: boolean },
    id?: number
  ) {
    this.boardHeight = 25;
    this.boardWidth = 40;
    if (id) this.id = id;
  }

  compressSquares() {
    return this.squares.map((square) => {
      square = { ...square };
      square.borders = { ...square.borders };
      for (let direction in square.borders) {
        let dir = <Direction>direction;
        if (square.borders[dir] !== null) {
          //@ts-ignore
          let borderId = square.borders[dir].id;
          //@ts-ignore
          square.borders[dir] = borderId;
        }
      }
      return square;
    });
  }

  async loadSquares() {
    let userMap = await db.userMaps.get(this.id);
    if (!userMap) throw new Error(`There is no user map with id ${this.id}`);

    let decompressed = userMap.squares.map((square) => {
      square = { ...square };
      square.borders = { ...square.borders };
      for (let direction in square.borders) {
        let dir = <Direction>direction;
        let borderId = <number>square.borders[dir];
        if (borderId !== null) {
          //@ts-ignore
          square.borders[dir] = userMap.squares[borderId - 1];
        }
      }
      return square;
    });
    this.squares = decompressed;
    return this;
  }

  save() {
    return db.userMaps.put(this).then((id) => (this.id = id));
  }
}

db.userMaps.mapToClass(UserMap);

export default db;
