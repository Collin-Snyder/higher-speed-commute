import { Entity } from "@fritzy/ecs";
import axios from "axios";
import { capitalize } from "../modules/gameHelpers";
import Editor, { commands } from "./editor";
import Game from "../main";
import { deleteUserMap, loadUserMap } from "../state/localDb";

export type Tool =
  | ""
  | "playerHome"
  | "bossHome"
  | "office"
  | "street"
  | "schoolZone"
  | "light"
  | "coffee"
  | "eraser";

class DesignModule {
  private _game: any;
  private _editor: Editor;
  public saved: boolean;
  public gridLoaded: boolean;
  public gridOverlay: HTMLImageElement;
  public selectedTool: Tool;
  public lastEditedSquare: number;
  public mapCursor: "default" | "pointer" | "cell";
  public quitting: boolean;

  constructor(game: any) {
    this._game = game;
    this._editor = new Editor(game);
    this.saved = true;
    this.selectedTool = "";
    this.lastEditedSquare = 0;
    this.mapCursor = "default";
    this.gridLoaded = false;
    this.gridOverlay = new Image();
    this.gridOverlay.src = "../design-grid.png";
    this.quitting = false;

    this.gridOverlay.onload = () => {
      this.gridLoaded = true;
    };

    for (let command in commands) {
      this._editor.addCommand(command, commands[command]);
    }
  }

  setDesignTool(tool: Tool) {
    this.selectedTool = tool;
    this.mapCursor = tool ? "cell" : "default";
  }

  editDesign() {
    if (!this.selectedTool) return;
    let global = this._game.ecs.getEntity("global").Global;
    let {
      MapData: { map },
      TileData,
      Coordinates,
      Renderable: { breakpointScale },
    } = this._game.ecs.getEntity("map");

    let mx = global.inputs.mouseX;
    let my = global.inputs.mouseY;
    let dragging = global.inputs.dragging;

    //find which square was clicked
    console.log("BreakpointScale: ", breakpointScale)
    let square = map.getSquareByCoords(
      (mx - Coordinates.X) / breakpointScale,
      (my - Coordinates.Y) / breakpointScale
    );

    //perform design map action on that square
    if (!square) {
      console.log(
        `You tried to edit a square at coordinates (${mx}x${my}) but there is no valid square there.`
      );
      return;
    }

    if (dragging && square.id == this.lastEditedSquare) return;
    if (
      dragging &&
      (this.selectedTool === "light" || this.selectedTool === "coffee")
    )
      return;

    let actionType;
    switch (this.selectedTool) {
      case "playerHome":
      case "bossHome":
      case "office":
        actionType = "KeySquare";
        break;
      default:
        actionType = capitalize(this.selectedTool);
    }

    if (!dragging) this._editor.beginGroup();
    const tileChanges = map[`handle${actionType}Action`](
      this._editor,
      square,
      dragging,
      this.selectedTool
    );
    if (!dragging) this._editor.endGroup();

    //handle resulting changes to tile map
    let { tiles } = TileData;
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
    this.lastEditedSquare = square.id;
  }

  save() {
    let {
      MapData: { map },
    } = this._game.ecs.getEntity("map");
    // let saved = map.map.exportForSave();
    // let userMap = map.map.exportForLocalSave();

    if (map?.id) {
      // axios
      //   .put(`/maps/${map.mapId}`, saved)
      //   .then((data: any) => {
      //     console.log(data.data);
      //     this.saved = true;
      //     let saveBtn = global.game.ecs.getEntity("saveButton");
      //     if (!saveBtn.has("Disabled"))
      //       saveBtn.addComponent("Disabled", DisabledButtons.save);
      //   })
      //   .catch((err: any) => {
      //     console.error(err);
      //   });
      // userMap.id = map.mapId;
      map
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

  openSaveAsModal() {
    window.toggleModal(true, "save");
  }

  async saveAsAsync(name: string) {
    let {
      MapData: { map },
    } = this._game.ecs.getEntity("map");

    if (name) {
      await map.saveNewMapAsync(name);

      this.saved = true;

      if (this.quitting) this._game.publish("quit");
      else map.name = name;
    }
  }

  openLoadSavedModal() {
    window.toggleModal(true, "loadMap");
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
        TileData.tiles = MapData.map.generateDesignTileMap();

        this._editor.restart();
      } catch (err) {
        console.error(err);
      }
    }
  }

  undo() {
    this._editor.undo();
    let {
      TileData,
      MapData: { map },
    } = this._game.ecs.getEntity("map");

    TileData.tiles = map.generateDesignTileMap();
  }

  redo() {
    this._editor.redo();
    let {
      TileData,
      MapData: { map },
    } = this._game.ecs.getEntity("map");
    TileData.tiles = map.generateDesignTileMap();
  }

  startDrawing() {
    this._editor.usePrevGroup();
    this._editor.beginGroup();
  }

  stopDrawing() {
    this._editor.endGroup();
  }

  confirmUnsaved() {
    let conf = window.confirm(
      "You currently have unsaved changes. Are you sure you want to exit?\n\nPress OK to discard changes and go home. Press Cancel to return to design."
    );
    this.saved = conf;
  }

  openResetModal() {
    window.toggleModal(true, "reset");
  }

  resetMap(resetChoice: "save" | "overwrite") {
    let {
      MapData: { map },
    } = this._game.ecs.getEntity("map");

    if (resetChoice === "save") {
      if (!this.saved) this.save();
      this.clearMap();
    }

    if (resetChoice === "overwrite") {
      if (map?.id) this.deleteMap(map.id);
      else this.clearMap();
    }

    this._editor.restart();
    this.saved = true;
  }

  clearMap() {
    let {
      MapData: { map },
      TileData,
    } = this._game.ecs.getEntity("map");
    map.clear(this._editor);
    TileData.tiles = map.generateDesignTileMap();
    map.id = null;
    map.name = "";
  }

  deleteMap(id: number) {
    deleteUserMap(id)
      .then((r) => {
        this.clearMap();
      })
      .catch((err) => console.error(err));
  }
}

export default DesignModule;
