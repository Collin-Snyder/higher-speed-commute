import ArcadeMap from "./arcadeMap";
// import { updateUserMap, saveNewUserMap } from "../localDb";

export default class SandboxMap extends ArcadeMap {
  static fromUserMapObject(mapObj: any) {
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

  tileIndex(squareId: number): number {
    return squareId - 1;
  }

  isKeySquare(squareId: number): boolean {
    return this.playerHome == squareId || this.bossHome == squareId || this.office == squareId;
  }

  determineTileValue(id: number): TTile | TTile[] {
    let square = <ISquare>this.getSquare(id);
    if (square.drivable) {
      if (this.playerHome === square.id) return "playerHome";
      if (this.bossHome === square.id) return "bossHome";
      if (this.office === square.id) return "office";

      let tiles: TTile[] = [];

      if (square.schoolZone) tiles.push("schoolZone");
      else tiles.push("street");

      if (this.lights.hasOwnProperty(square.id)) tiles.push("greenLight");
      else if (this.coffees.hasOwnProperty(square.id)) tiles.push("coffee");

      return tiles.length > 1 ? tiles : tiles[0];
    }
    return "";
  }

  compressSquares() {
    let compressed = this.squares.map((square) => {
      square = { ...square };
      square.borders = { ...square.borders };
      for (let direction in square.borders) {
        let dir = <TDirection>direction;
        if (square.borders[dir] !== null) {
          //@ts-ignore
          let borderId = square.borders[dir].id;
          //@ts-ignore
          square.borders[dir] = borderId;
        }
        if (square.borders[dir] === undefined) {
          console.error(
            new Error(
              "Found undefined border data for square " +
                square.id +
                " during compression"
            )
          );
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
      id: this.id,
    };
    return mapObj;
  }

  // async saveMapAsync(): Promise<any> {
  //   if (!this.id)
  //     throw new Error(
  //       "You are trying to use saveMapAsync to save a map that does not already have an associated id. Please use saveNewMapAsync instead"
  //     );
  //   let updatedMap = <SandboxMap>this.exportForLocalSaveAs();
  //   updatedMap.id = this.id;
  //   // console.log("Current map with id ", this.id, " is being updated");
  //   return updateUserMap(updatedMap);
  // }

  // async saveNewMapAsync(name: string): Promise<any> {
  //   this.name = name;
  //   let newSandboxMap = <SandboxMap>this.exportForLocalSaveAs();
  //   let newId = await saveNewUserMap(newSandboxMap);
  //   this.id = newId;
  //   // console.log(
  //   //   `This map is now called ${this.name} and was saved under id ${this.id}`
  //   // );
  // }

  compress() {
    let compressedSq = this.squares.map((square) => {
      square = { ...square };
      square.borders = { ...square.borders };
      for (let direction in square.borders) {
        let dir = <TDirection>direction;
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
        let dir = <TDirection>direction;
        let borderId = <number>square.borders[dir];
        if (borderId !== null) {
          //@ts-ignore
          square.borders[dir] = this.squares[borderId - 1];
        }
        if (square.borders[dir] === undefined) {
          console.error(
            new Error(
              "Found undefined border data for square " +
                square.id +
                " during decompress"
            )
          );
          debugger;
        }
      }
      return square;
    });
    this.squares = decompressed;
    return this;
  }
}
