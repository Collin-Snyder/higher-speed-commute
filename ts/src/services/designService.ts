import { capitalize, openModal } from "gameHelpers";
import { randomNumBtwn } from "gameMath";
import MapEditor from "./mapEditor";
import {
  deleteUserMap,
  loadUserMap,
  updateUserMap,
  saveNewUserMap,
} from "../localDb";

class DesignModule {
  private _game: any;
  private _editor: IMapEditor;
  public saved: boolean;
  public gridLoaded: boolean;
  public gridOverlay: HTMLImageElement;
  public selectedTool: TDesignTool;
  public lastEditedSquare: number;
  public mapCursor: "default" | "pointer" | "cell" | "no-drop" | "not-allowed";
  public quitting: boolean;
  public dragging: boolean;

  constructor(game: any) {
    this._game = game;
    this._editor = new MapEditor(game);
    this.saved = true;
    this.selectedTool = "";
    this.lastEditedSquare = 0;
    this.mapCursor = "default";
    this.gridLoaded = false;
    this.gridOverlay = new Image();
    this.gridOverlay.src = "./design-grid.png";
    this.quitting = false;
    this.dragging = false;

    this.gridOverlay.onload = () => {
      this.gridLoaded = true;
    };
  }

  get map() {
    return this._game.ecs.getEntity("map").MapData.map;
  }

  ///// DESIGN MODE STATE UPDATES /////

  setDesignTool(tool: TDesignTool) {
    this.selectedTool = tool;
    this.mapCursor = tool ? "cell" : "default";
    this._game.publish(
      "focusSelector",
      "button",
      this._game.ecs.getEntity(`${tool}Button`)
    );
  }

  setMapCursor() {
    if (this.selectedTool !== "coffee" && this.selectedTool !== "light") {
      this.mapCursor = "cell";
      return;
    }
    let {
      inputs: { mouseX, mouseY },
    } = this._game.ecs.getEntity("global").Global;
    let {
      Coordinates: { X, Y },
    } = this._game.ecs.getEntity("map");

    let square = this.map.getSquareByCoords(mouseX - X, mouseY - Y);

    if (square.drivable && !this.map.isKeySquare(square.id))
      this.mapCursor = "cell";
    else this.mapCursor = "no-drop";
  }

  ///// EDIT ACTIONS /////

  editDesign() {
    if (!this.selectedTool) return;

    let square = this.findTargetSquare();

    if (!this.validateEdit(square)) return;

    let actionType = this.findActionType();

    if (!this.dragging) this._editor.beginActionGroup();
    let actionHandler = `handle${actionType}Action` as TDesignActionHandlerName;
    const tileChanges = this[actionHandler](square);
    if (!this.dragging) this._editor.endActionGroup();

    this.updateTileMap(tileChanges);

    this.lastEditedSquare = square.id;
  }

  findTargetSquare() {
    let global = this._game.ecs.getEntity("global").Global;
    let {
      MapData: { map },
      Coordinates,
      Renderable: { breakpointScale },
    } = this._game.ecs.getEntity("map");

    let mx = global.inputs.mouseX;
    let my = global.inputs.mouseY;

    let square = map.getSquareByCoords(
      (mx - Coordinates.X) / breakpointScale,
      (my - Coordinates.Y) / breakpointScale
    );

    if (!square) {
      console.error(
        new Error(
          `You tried to edit a square at coordinates (${mx}x${my}) but there is no valid square there.`
        )
      );
    }

    return square;
  }

  validateEdit(square: ISquare) {
    if (!square) return false;
    if (this.dragging && square.id == this.lastEditedSquare) return false;
    if (
      this.dragging &&
      (this.selectedTool === "light" || this.selectedTool === "coffee")
    )
      return false;
    return true;
  }

  findActionType() {
    switch (this.selectedTool) {
      case "playerHome":
      case "bossHome":
      case "office":
        return "KeySquare";
      default:
        return capitalize(this.selectedTool);
    }
  }

  updateTileMap(tileChanges: number[]) {
    let {
      MapData: { map },
      TileData: { tiles },
    } = this._game.ecs.getEntity("map");
    tileChanges.forEach((id: number) => {
      let index = id - 1;
      let oldTile = tiles[index].type;
      let newTile = map.determineTileValue(id);
      // debugger;
      if (oldTile !== newTile) {
        tiles[index].type = newTile;
        this.saved = false;
      }
    });
  }

  handleKeySquareAction(square: ISquare) {
    let id = square.id;
    let keySquareId = this.map[this.selectedTool as TKeySquare];
    let tileChanges = [];
    let isKeySquare = keySquareId === square.id;
    let keySquareExists = keySquareId > 0;

    if (isKeySquare) {
      this._editor.makeNotDrivable(id);
      this._editor.removeKeySquare(this.selectedTool as TKeySquare);
    } else {
      if (keySquareExists) {
        tileChanges.push(keySquareId);
        this._editor.makeNotDrivable(keySquareId);
        this._editor.removeKeySquare(this.selectedTool as TKeySquare);
      }
      if (!square.drivable) this._editor.makeDrivable(id);
      if (square.schoolZone) this._editor.makeNotSchoolZone(id);
      this._editor.makeKeySquare(this.selectedTool as TKeySquare, id);
    }
    tileChanges.push(id);
    return tileChanges;
  }

  handleStreetAction(square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let isPlayerHome = this.map.playerHome === id;
    let isBossHome = this.map.bossHome === id;
    let isOffice = this.map.office === id;
    let hasLight = this.map.lights.hasOwnProperty(id);
    let hasCoffee = this.map.coffees.hasOwnProperty(id);

    if (isPlayerHome) {
      this._editor.removeKeySquare("playerHome");
      this._editor.makeNotDrivable(id);
    }
    if (isBossHome) {
      this._editor.removeKeySquare("bossHome");
      this._editor.makeNotDrivable(id);
    }
    if (isOffice) {
      this._editor.removeKeySquare("office");
      this._editor.makeNotDrivable(id);
    }
    if (hasLight) {
      this._editor.removeLight(id);
    }
    if (hasCoffee) {
      this._editor.removeCoffee(id);
    }
    if (square.drivable && square.schoolZone) {
      this._editor.makeNotSchoolZone(id);
    } else if (square.drivable && !this.dragging) {
      this._editor.makeNotDrivable(id);
    } else if (!square.drivable) {
      this._editor.makeDrivable(id);
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleSchoolZoneAction(square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let isKeySquare = this.map.isKeySquare(id);

    if (square.drivable && square.schoolZone && !this.dragging) {
      this._editor.makeNotSchoolZone(id);
      this._editor.makeNotDrivable(id);
    } else if (square.drivable && !square.schoolZone && !isKeySquare) {
      this._editor.makeSchoolZone(id);
    } else if (!square.drivable && !square.schoolZone) {
      this._editor.makeDrivable(id);
      this._editor.makeSchoolZone(id);
    }
    tileChanges.push(id);
    return tileChanges;
  }

  handleLightAction(square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let hasLight = this.map.lights.hasOwnProperty(id);
    let hasCoffee = this.map.coffees.hasOwnProperty(id);
    let isKeySquare = this.map.isKeySquare(id);

    if (hasLight) {
      this._editor.removeLight(id);
    } else {
      if (hasCoffee) {
        this._editor.removeCoffee(id);
      }
      if (!isKeySquare && square.drivable) {
        this._editor.addLight(id, randomNumBtwn(4, 12) * 1000);
      }
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleCoffeeAction(square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let hasLight = this.map.lights.hasOwnProperty(id);
    let hasCoffee = this.map.coffees.hasOwnProperty(id);
    let isKeySquare = this.map.isKeySquare(id);

    if (hasCoffee) {
      this._editor.removeCoffee(id);
    } else {
      if (hasLight) {
        this._editor.removeLight(id);
      }
      if (!isKeySquare && square.drivable) {
        this._editor.addCoffee(id);
      }
    }

    tileChanges.push(id);
    return tileChanges;
  }

  handleEraserAction(square: ISquare) {
    let id = square.id;
    let tileChanges = [];
    let isPlayerHome = this.map.playerHome === id;
    let isBossHome = this.map.bossHome === id;
    let isOffice = this.map.office === id;
    let hasLight = this.map.lights.hasOwnProperty(id);
    let hasCoffee = this.map.coffees.hasOwnProperty(id);

    if (isPlayerHome) this._editor.removeKeySquare("playerHome");
    else if (isBossHome) this._editor.removeKeySquare("bossHome");
    else if (isOffice) this._editor.removeKeySquare("office");

    if (square.schoolZone) this._editor.makeNotSchoolZone(id);
    if (square.drivable) this._editor.makeNotDrivable(id);

    if (hasLight) this._editor.removeLight(id);
    if (hasCoffee) this._editor.removeCoffee(id);

    tileChanges.push(id);
    return tileChanges;
  }

  undo() {
    this._editor.undo();
    let { TileData } = this._game.ecs.getEntity("map");

    TileData.tiles = this.map.generateDesignTileMap();
  }

  redo() {
    this._editor.redo();
    let { TileData } = this._game.ecs.getEntity("map");
    TileData.tiles = this.map.generateDesignTileMap();
  }

  startDrawing() {
    this.dragging = true;
    this._editor.usePrevGroup();
    this._editor.beginActionGroup();
  }

  stopDrawing() {
    this.dragging = false;
    this._editor.endActionGroup();
  }

  ///// SAVE ACTIONS /////

  save() {
    if (!this.verifyValidMap()) this.openInvalidMapModal();
    else if (this.map?.id) {
      this.map
        .saveMapAsync()
        .then((result: any) => {
          this.saved = true;
          if (this.quitting) this._game.publish("quit");
        })
        .catch((err: Error) => console.error(err));
    } else {
      this.openSaveAsModal();
    }
  }

  verifyValidMap() {
    return this.map.hasAllKeySquares();
  }

  async saveAsync() {
    if (!this.verifyValidMap()) this.openInvalidMapModal();
    else if (this.map?.id) {
      if (!this.map.id)
        throw new Error(
          "You are trying to save a map that does not already have an associated id. Please use saveAsAsync instead"
        );
      let updatedMap = <ISandboxMap>this.map.exportForLocalSaveAs();
      updatedMap.id = this.map.id;
      // console.log("Current map with id ", this.id, " is being updated");
      await updateUserMap(updatedMap);
      this.saved = true;
      if (this.quitting) this._game.publish("quit");
    } else {
      this.openSaveAsModal();
    }
  }

  async saveAsAsync(name: string) {
    if (name) {
      // await this.map.saveNewMapAsync(name);
      this.map.name = name;
      let newSandboxMap = <ISandboxMap>this.map.exportForLocalSaveAs();
      let newId = await saveNewUserMap(newSandboxMap);
      this.map.id = newId;

      this.saved = true;

      if (this.quitting) this._game.publish("quit");
      else this.map.name = name;
    }
  }

  async loadSaved(levelId: number) {
    levelId = Number(levelId);
    if (levelId) {
      try {
        let savedMap = await loadUserMap(levelId);
        if (!savedMap)
          throw new Error(`There is no user map with id ${levelId}`);
        let decompressed = savedMap.decompress();

        let { MapData, TileData } = this._game.ecs.getEntity("map");

        MapData.map = decompressed;
        TileData.tiles = this.map.generateDesignTileMap();

        this._editor.restart();
      } catch (err) {
        console.error(err);
      }
    }
  }

  ///// DESTROY ACTIONS /////

  resetMap(resetChoice: "save" | "overwrite") {
    if (resetChoice === "save") {
      if (!this.saved) this.save();
      this.clearMap();
    }

    if (resetChoice === "overwrite") {
      if (this.map?.id) this.deleteMap(this.map.id);
      else this.clearMap();
    }

    this._editor.restart();
    this.saved = true;
  }

  clearMap() {
    let { TileData } = this._game.ecs.getEntity("map");

    this._editor.removeKeySquare("playerHome");
    this._editor.removeKeySquare("bossHome");
    this._editor.removeKeySquare("office");

    for (let square of this.map.squares) {
      let id = square.id;
      this._editor.makeNotSchoolZone(id);
      this._editor.makeNotDrivable(id);
      this._editor.removeLight(id);
      this._editor.removeCoffee(id);
    }

    TileData.tiles = this.map.generateDesignTileMap();
    this.map.id = null;
    this.map.name = "";
  }

  deleteMap(id: number) {
    deleteUserMap(id)
      .then((r) => {
        this.clearMap();
      })
      .catch((err) => console.error(err));
  }

  ///// MODALS /////

  openSaveAsModal() {
    if (!this.verifyValidMap()) this.openInvalidMapModal();
    else openModal("save");
  }

  openInvalidMapModal() {
    openModal("missingKeySquares");
  }

  openLoadSavedModal() {
    openModal("loadMap");
  }

  openResetModal() {
    openModal("reset");
  }
}

export default DesignModule;
