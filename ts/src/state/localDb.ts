import Dexie from "dexie";
import { SquareInterface } from "./map";

export class LocalDB extends Dexie {
  userMaps: Dexie.Table<UserMap>;

  constructor() {
    super("LocalDB");

    this.version(1).stores({
      maps: "++id, &name",
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

export class UserMap implements IUserMap {
  id?: number;
  public boardHeight: number;
  public boardWidth: number;

  constructor(
    public name: string,
    public playerHome: number,
    public bossHome: number,
    public office: number,
    public squares: SquareInterface[],
    public lights: { [squareId: string]: number },
    public coffees: { [squareId: string]: boolean },
    id?: number
  ) {
    this.boardHeight = 25;
    this.boardWidth = 40;
    if (id) this.id = id;
  }
}

const db = new LocalDB();
db.userMaps.mapToClass(UserMap);

export default db;
