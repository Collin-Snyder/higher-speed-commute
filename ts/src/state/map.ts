import {
  calculateSurroundingSquareCount,
  randomNumBtwn,
} from "gameMath";
import Editor from "../modules/editor";
import { updateUserMap, saveNewUserMap } from "./localDb";

export interface IArcadeMap {
  squares: ISquare[];
  squareCount: number;
  width: number;
  height: number;
  playerHome: number;
  bossHome: number;
  office: number;
  lights: { [key: string]: number };
  coffees: { [key: string]: boolean };
  pixelWidth: number;
  pixelHeight: number;
  name?: string;
  id?: number;
  generateTileMap: Function;
  getSquare: Function;
  setSquare: Function;
  findPath: Function;
}

export interface IMapObject {
  squares: ISquare[];
  boardWidth: number;
  boardHeight: number;
  playerHome: number;
  bossHome: number;
  office: number;
  lights: { [key: string]: number };
  coffees: { [key: string]: boolean };
  id: number;
  name: string;
}

export interface IMiniMapObject {
  i: number;
  n: string;
  h: number;
  w: number;
  p: number;
  b: number;
  o: number;
  l: { [key: string]: number };
  c: number[];
  s: any[];
}

export interface ISquare {
  id: number;
  row: number;
  column: number;
  borders: Borders | BordersCompressed;
  drivable: boolean;
  schoolZone: boolean;
  [key: string]: any;
}

export interface ITile {
  type: Tile | Tile[];
  a: number;
  w: number;
  h: number;
  deg: number;
  display: boolean;
  [key: string]: any;
}

type Borders = {
  [key in Direction]: ISquare | null;
};

type BordersCompressed = {
  [key in Direction]: number | null;
};

export type Direction = "up" | "down" | "left" | "right";

export type Tile =
  | "street"
  | "tree"
  | "house"
  | "playerHome"
  | "bossHome"
  | "office"
  | "schoolZone"
  | "greenLight"
  | "coffee"
  | "";

export class Square implements ISquare {
  public drivable: boolean;
  public borders: Borders;
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

export class ArcadeMap implements IArcadeMap {
  public squareCount: number;
  public squares: ISquare[];
  public playerHome: number;
  public bossHome: number;
  public office: number;
  public lights: { [key: string]: number };
  public coffees: { [key: string]: boolean };
  public name: string;
  public id: number;

  static fromMapObject(mapObj: IMapObject): ArcadeMap {
    const {
      id,
      name,
      boardWidth,
      boardHeight,
      squares,
      playerHome,
      bossHome,
      office,
      lights,
      coffees,
    } = mapObj;

    const newMap = new this(boardWidth, boardHeight);

    newMap.id = id;
    newMap.name = name;
    newMap.playerHome = playerHome;
    newMap.bossHome = bossHome;
    newMap.office = office;
    newMap.lights = lights;
    newMap.coffees = coffees;

    for (let i = 0; i < squares.length; i++) {
      newMap.squares[i].drivable = squares[i].drivable;
      newMap.squares[i].schoolZone = squares[i].schoolZone;
    }
    return newMap;
  }

  static fromMiniMapObject(miniMapObj: IMiniMapObject): ArcadeMap {
    let { h, w, p, b, o, l, c, s } = miniMapObj;
    let coffees = <{ [key: string]: boolean }>{};
    c.forEach((id) => (coffees[id] = true));

    const newMap = new this(w, h);

    newMap.playerHome = p;
    newMap.bossHome = b;
    newMap.office = o;
    newMap.lights = l;
    newMap.coffees = coffees;

    s.forEach((s: any) => {
      let { i, d, z } = s;
      let id = Number(i);
      newMap.setSquare(id, "drivable", !!d);
      newMap.setSquare(id, "schoolZone", !!z);
    });

    return newMap;
  }

  constructor(public boardWidth: number, public boardHeight: number) {
    this.squares = [];
    this.squareCount = boardWidth * boardHeight;
    this.playerHome = 0;
    this.bossHome = 0;
    this.office = 0;
    this.lights = {};
    this.coffees = {};
    this.name = "";
    this.id = 0;

    this.generateSquares();

    this.getSquare = this.getSquare.bind(this);
    this.setSquare = this.setSquare.bind(this);
    this.addBorders = this.addBorders.bind(this);
  }

  get width() {
    return this.boardWidth;
  }

  get height() {
    return this.boardHeight;
  }

  get pixelWidth() {
    return this.width * 25;
  }

  get pixelHeight() {
    return this.height * 25;
  }

  generateSquares() {
    for (let s = 1; s <= this.squareCount; s++) {
      this.squares.push(
        new Square(
          s,
          Math.ceil(s / this.width),
          Math.floor(s % this.width) > 0
            ? Math.floor(s % this.width)
            : this.width
        )
      );
    }

    this.squares.forEach((square) => {
      this.addBorders(square);
    });
  }

  addBorders(square: ISquare) {
    const id = square.id;

    if ((id - 1) % this.width !== 0) square.borders.left = this.squares[id - 2];

    if (id % this.width !== 0) square.borders.right = this.squares[id];

    if (id - this.width > 0)
      square.borders.up = this.squares[id - this.width - 1];

    if (id + this.width <= this.squareCount)
      square.borders.down = this.squares[id + this.width - 1];

    return square;
  }

  getSquare(s: number): ISquare | null {
    if (!this.squares[s - 1]) {
      console.log("Invalid square id");
      return null;
    }
    //@ts-ignore
    return this.squares[s - 1];
  }

  setSquare(s: number, key: string, val: any) {
    if (!this.squares[s - 1]) {
      console.log("Invalid square id");
      return undefined;
    }
    this.squares[s - 1][key] = val;
    return this.squares[s - 1];
  }

  generateTileMap(isRefMap: boolean = false): ITile[] {
    return this.squares.map((s: ISquare) => {
      let type = <Tile>"";

      if (s.drivable) {
        if (s.schoolZone && !isRefMap) type = "schoolZone";
        else if (this.playerHome === s.id) type = "playerHome";
        else if (this.bossHome === s.id) type = "bossHome";
        else if (this.office === s.id) type = "office";
        else type = "street";
      } else if (!isRefMap) {
        if (Math.random() < 0.4) {
          // @ts-ignore
          if (Math.random() <= 0.07) type = "tree1";
          // @ts-ignore
          else type = "tree" + Math.round(Math.random() + 2);
        }
        else if (
          Math.random() < 0.3 &&
          typeof s.borders.down != "number" &&
          s.borders.down?.drivable
        ) {
          type = "house";
        } else if (Math.random() < 0.7) {
          //@ts-ignore
          if (Math.random() < 0.8) type = "smallObj" + Math.round(Math.random() * 3 + 1);
          //@ts-ignore
          else type = "medObj" + Math.round(Math.random() + 1);
        }
        // else {
        //   // @ts-ignore
        //   type = "grass" + Math.round(Math.random() * 7 + 1);
        // }
      }

      return {
        id: s.id,
        type,
        a: 1,
        h: 25,
        w: 25,
        row: s.row,
        col: s.column,
        deg: 0,
        display: true,
      };
    });
  }

  generateReferenceTileMap(): Tile[] {
    return this.squares.map((s: ISquare) => {
      if (this.playerHome === s.id) return "playerHome";
      if (this.bossHome === s.id) return "bossHome";
      if (this.office === s.id) return "office";
      if (s.drivable) return "street";
      return "";
    });
  }

  getSquareByCoords(X: number, Y: number): ISquare | null {
    X = Math.floor(X / 25) * 25;
    Y = Math.floor(Y / 25) * 25;
    let row = Y / 25;
    let col = X / 25 + 1;
    let id = row * 40 + col;
    if (row > 25 || col > 40) return null;
    return this.getSquare(id);
  }

  getSurroundingSquares(x: number, y: number, layers: number) {
    let startSquare: ISquare = <ISquare>(
      this.getSquareByCoords(x < 0 ? 0 : x, y < 0 ? 0 : y)
    );
    let queue = new PathQueue();
    let visited: { [key: string]: boolean } = {};
    let toInclude: ISquare[] = [];
    let sqCount = calculateSurroundingSquareCount(layers);
    let count = 0;

    queue.put(startSquare);
    visited[startSquare.id] = true;
    toInclude.push(startSquare);

    while (!queue.empty() && count < sqCount) {
      let currentId = queue.get();
      let currentSquare: ISquare = <ISquare>this.getSquare(currentId);

      toInclude.push(currentSquare);

      for (let direction in currentSquare.borders) {
        let next = <ISquare>currentSquare.borders[<Direction>direction];
        if (next && !visited.hasOwnProperty(next.id)) {
          queue.put(next);
          visited[next.id] = true;
        }
      }
      count++;
    }
    return toInclude;
  }

  getAttributesByCoords(X: number, Y: number, attributes: string[]): any {
    let square = this.getSquareByCoords(X, Y);
    let attrVals: object = {};
    if (!square) {
      console.log("Invalid coordinates - no valid square at this location.");
      return null;
    }
    for (let attribute of attributes) {
      if (!square.hasOwnProperty(attribute)) {
        console.log(
          "Invalid attribute name. Accessible attributes are: ",
          ...Object.keys(square)
        );
        continue;
      }
      //@ts-ignore
      attrVals[attribute] = square[attribute];
    }
    if (Object.keys(attrVals).length === 0) return null;
    //@ts-ignore
    return square[attribute];
  }

  getKeySquare(k: "playerHome" | "bossHome" | "office") {
    return this.getSquare(this[k]);
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Array<number>[] | null {
    let startSquare = <ISquare>this.getSquareByCoords(startX, startY);
    let endSquare = <ISquare>this.getSquareByCoords(endX, endY);

    let frontier = new PathQueue();
    let cameFrom: { [key: string]: any } = {};
    let pathStack = [];
    let foundTarget = false;

    //start the queue with the starting square (start)
    frontier.put(startSquare);
    //assign start's "cameFrom" property to null
    cameFrom[startSquare.id] = null;

    //run a loop to expand the frontier in every direction on each iteration and break if end is reached
    while (frontier.empty() === false) {
      let currentId = frontier.get();

      let currentSquare = <ISquare>this.squares[currentId - 1];

      if (currentId == endSquare.id) {
        foundTarget = true;
        break;
      }

      for (let direction in currentSquare.borders) {
        let next = <ISquare>currentSquare.borders[<Direction>direction];
        if (next && next.drivable && !cameFrom.hasOwnProperty(next.id)) {
          frontier.put(next);
          cameFrom[next.id] = currentId;
        }
      }
    }

    if (!foundTarget) {
      console.log(
        `No valid path from square ${startSquare.id} to square ${endSquare.id}`
      );
      return [[0, 0]];
    }

    let current = endSquare;
    //loop backwards through the path taken to reach the end and add to stack
    while (current.id !== startSquare.id) {
      let { X, Y } = current.coordinates;
      pathStack.push([X, Y]);
      // current.bossPath = true;
      current = <ISquare>this.getSquare(cameFrom[current.id]);
    }
    pathStack.push([startX, startY]);
    return pathStack;
  }
}

class PathQueue {
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

export class SandboxMap extends ArcadeMap {
  static fromUserMapObject(mapObj: any) {
    console.log(mapObj);
    let { boardWidth, boardHeight, playerHome, bossHome } = mapObj;
    let converted = {
      ...mapObj,
      board_width: boardWidth,
      board_height: boardHeight,
      player_home: playerHome,
      boss_home: bossHome,
    };
    return SandboxMap.fromMapObject(converted);
  }

  constructor(width: number, height: number) {
    super(width, height);
  }

  generateDesignTileMap() {
    return this.squares.map((s: ISquare) => {
      return {
        type: this.determineTileValue(s.id),
        a: 1,
        w: 25,
        h: 25,
        deg: 0,
        xoffset: 0,
        yoffset: 0,
        display: true,
      };
    });
  }

  tileIndex(id: number): number {
    return id - 1;
  }

  isKeySquare(id: number): boolean {
    return this.playerHome == id || this.bossHome == id || this.office == id;
  }

  determineTileValue(id: number): Tile | Tile[] {
    let square = <Square>this.getSquare(id);
    if (square.drivable) {
      if (this.playerHome === square.id) return "playerHome";
      if (this.bossHome === square.id) return "bossHome";
      if (this.office === square.id) return "office";

      let tiles: Tile[] = [];

      if (square.schoolZone) tiles.push("schoolZone");
      else tiles.push("street");

      if (this.lights.hasOwnProperty(square.id)) tiles.push("greenLight");
      else if (this.coffees.hasOwnProperty(square.id)) tiles.push("coffee");

      return tiles.length > 1 ? tiles : tiles[0];
    }
    return "";
  }

  handleKeySquareAction(
    editor: Editor,
    square: ISquare,
    drawing: boolean,
    tool: "playerHome" | "bossHome" | "office"
  ) {
    console.log(`Adding ${tool}!`);
    let id = square.id;
    let keySquareId = this[tool];
    let tileChanges = [];
    let isKeySquare = keySquareId === square.id;
    let keySquareExists = keySquareId > 0;

    if (isKeySquare) {
      editor.execute("makeNotDrivable", id);
      editor.execute("removeKeySquare", tool, id);
    } else {
      if (keySquareExists) {
        tileChanges.push(keySquareId);
        editor.execute("makeNotDrivable", keySquareId);
        editor.execute("removeKeySquare", tool, keySquareId);
      }
      if (!square.drivable) editor.execute("makeDrivable", id);
      if (square.schoolZone) editor.execute("makeNotSchoolZone", id);
      editor.execute("makeKeySquare", tool, id);
    }
    tileChanges.push(id);
    return tileChanges;
  }

  handleStreetAction(editor: Editor, square: ISquare, drawing: boolean) {
    let id = square.id;
    let tileChanges = [];
    let isPlayerHome = this.playerHome === id;
    let isBossHome = this.bossHome === id;
    let isOffice = this.office === id;
    let hasLight = this.lights.hasOwnProperty(id);
    let hasCoffee = this.coffees.hasOwnProperty(id);

    if (isPlayerHome) {
      editor.execute("removeKeySquare", "playerHome", id);
      editor.execute("makeNotDrivable", id);
    }
    if (isBossHome) {
      editor.execute("removeKeySquare", "bossHome", id);
      editor.execute("makeNotDrivable", id);
    }
    if (isOffice) {
      editor.execute("removeKeySquare", "office", id);
      editor.execute("makeNotDrivable", id);
    }
    if (hasLight) {
      editor.execute("removeLight", id);
    }
    if (hasCoffee) {
      editor.execute("removeCoffee", id);
    }
    if (square.drivable && square.schoolZone) {
      editor.execute("makeNotSchoolZone", id);
    } else if (square.drivable && !drawing) {
      editor.execute("makeNotDrivable", id);
    } else if (!square.drivable) {
      editor.execute("makeDrivable", id);
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleSchoolZoneAction(editor: Editor, square: ISquare, drawing: boolean) {
    let id = square.id;
    let tileChanges = [];
    let isKeySquare = this.isKeySquare(id);

    if (square.drivable && square.schoolZone && !drawing) {
      editor.execute("makeNotSchoolZone", id);
      editor.execute("makeNotDrivable", id);
    } else if (square.drivable && !square.schoolZone && !isKeySquare) {
      editor.execute("makeSchoolZone", id);
    } else if (!square.drivable && !square.schoolZone) {
      editor.execute("makeDrivable", id);
      editor.execute("makeSchoolZone", id);
    }
    tileChanges.push(id);
    return tileChanges;
  }

  handleLightAction(editor: Editor, square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let hasLight = this.lights.hasOwnProperty(id);
    let hasCoffee = this.coffees.hasOwnProperty(id);
    let isKeySquare = this.isKeySquare(id);

    if (hasLight) {
      editor.execute("removeLight", id);
    } else {
      if (hasCoffee) {
        editor.execute("removeCoffee", id);
      }
      if (!isKeySquare && square.drivable) {
        editor.execute("addLight", id, randomNumBtwn(4, 12) * 1000);
      }
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleCoffeeAction(editor: Editor, square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let hasLight = this.lights.hasOwnProperty(id);
    let hasCoffee = this.coffees.hasOwnProperty(id);
    let isKeySquare = this.isKeySquare(id);

    if (hasCoffee) {
      editor.execute("removeCoffee", id);
    } else {
      if (hasLight) {
        editor.execute("removeLight", id);
      }
      if (!isKeySquare && square.drivable) {
        editor.execute("addCoffee", id);
      }
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleEraserAction(editor: Editor, square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let isPlayerHome = this.playerHome === id;
    let isBossHome = this.bossHome === id;
    let isOffice = this.office === id;
    let hasLight = this.lights.hasOwnProperty(id);
    let hasCoffee = this.coffees.hasOwnProperty(id);

    if (isPlayerHome) editor.execute("removeKeySquare", "playerHome", id);
    else if (isBossHome) editor.execute("removeKeySquare", "bossHome", id);
    else if (isOffice) editor.execute("removeKeySquare", "office", id);

    if (square.schoolZone) editor.execute("makeNotSchoolZone", id);
    if (square.drivable) editor.execute("makeNotDrivable", id);

    if (hasLight) editor.execute("removeLight", id);
    if (hasCoffee) editor.execute("removeCoffee", id);

    tileChanges.push(id);
    return tileChanges;
  }

  compressSquares() {
    let compressed = this.squares.map((square) => {
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
        if (square.borders[dir] === undefined) {
          console.log(
            "Found undefined border data for square ",
            square.id,
            " during compression"
          );
          debugger;
        }
      }
      return square;
    });

    return compressed;
  }

  exportForSave() {
    const save = {
      board_height: this.height,
      board_width: this.width,
      player_home: this.playerHome,
      boss_home: this.bossHome,
      office: this.office,
      squares: JSON.stringify(this.compressSquares()),
      lights: JSON.stringify(this.lights),
      coffees: JSON.stringify(this.coffees),
    };
    return save;
  }

  exportForLocalSaveAs() {
    const save = {
      boardHeight: this.height,
      boardWidth: this.width,
      playerHome: this.playerHome,
      bossHome: this.bossHome,
      office: this.office,
      squares: this.compressSquares(),
      lights: this.lights,
      coffees: this.coffees,
      name: this.name,
    };
    return save;
  }

  exportMapObject(): IMapObject {
    const mapObj = {
      boardHeight: this.height,
      boardWidth: this.width,
      playerHome: this.playerHome,
      bossHome: this.bossHome,
      office: this.office,
      squares: this.squares,
      lights: this.lights,
      coffees: this.coffees,
      name: this.name ? this.name : "Untitled map",
      id: this.id
    };
    return mapObj;
  }

  async saveMapAsync(): Promise<any> {
    if (!this.id)
      throw new Error(
        "You are trying to use saveMapAsync to save a map that does not already have an associated id. Please use saveNewMapAsync instead"
      );
    let updatedMap = <SandboxMap>this.exportForLocalSaveAs();
    updatedMap.id = this.id;
    console.log("Current map with id ", this.id, " is being updated")
    return updateUserMap(updatedMap);
  }

  async saveNewMapAsync(name: string): Promise<any> {
    this.name = name;
    let newSandboxMap = <SandboxMap>this.exportForLocalSaveAs();
    let newId = await saveNewUserMap(newSandboxMap);
    this.id = newId;
    console.log(`This map is now called ${this.name} and was saved under id ${this.id}`)
  }

  compress() {
    let compressedSq = this.squares.map((square) => {
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
    this.squares = compressedSq;
    return this;
  }

  decompress() {
    let decompressed = this.squares.map((square) => {
      square = { ...square };
      square.borders = { ...square.borders };
      for (let direction in square.borders) {
        let dir = <Direction>direction;
        let borderId = <number>square.borders[dir];
        if (borderId !== null) {
          //@ts-ignore
          square.borders[dir] = this.squares[borderId - 1];
        }
        if (square.borders[dir] === undefined) {
          console.log(
            "Found undefined border data for square ",
            square.id,
            " during decompress"
          );
          debugger;
        }
      }
      return square;
    });
    this.squares = decompressed;
    return this;
  }

  clear(editor: Editor) {
    editor.execute("removeKeySquare", "playerHome");
    editor.execute("removeKeySquare", "bossHome");
    editor.execute("removeKeySquare", "office");
    for (let square of this.squares) {
      let id = square.id;
      editor.execute("makeNotSchoolZone", id);
      editor.execute("makeNotDrivable", id);
      editor.execute("removeLight", id);
      editor.execute("removeCoffee", id);
    }
  }
}

// export default ArcadeMap;
