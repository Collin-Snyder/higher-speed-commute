import { Entity } from "@fritzy/ecs";
import axios from "axios";
import { capitalize } from "../modules/gameHelpers";
import { centerWithin } from "../modules/gameMath";
import { SandboxMap } from "../state/map";
import Editor, { commands } from "./editor";
import { DisabledButtons } from "../buttonModifiers";
import { DesignMenuName, ButtonInterface } from "../state/menuButtons";
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
    let mx = global.inputs.mouseX;
    let my = global.inputs.mouseY;
    let dragging = global.inputs.dragging;
    let mapEntity = global.map;
    let designMap = mapEntity.Map.map;

    //find which square was clicked
    let square = designMap.getSquareByCoords(
      mx - mapEntity.Coordinates.X,
      my - mapEntity.Coordinates.Y
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
    const tileChanges = designMap[`handle${actionType}Action`](
      this._editor,
      square,
      dragging,
      this.selectedTool
    );
    if (!dragging) this._editor.endGroup();

    //handle resulting changes to tile map
    let tiles = mapEntity.TileMap.tiles;
    tileChanges.forEach((id: number) => {
      let index = id - 1;
      let oldTile = tiles[index].type;
      let newTile = designMap.determineTileValue(id);
      // debugger;
      if (oldTile !== newTile) {
        tiles[index].type = newTile;
        this.saved = false;
      }
    });
    this.lastEditedSquare = square.id;
  }

  save() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    // let saved = map.map.exportForSave();
    // let userMap = map.map.exportForLocalSave();

    if (map.mapId) {
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
      map.map
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

  saveAs(name: string) {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    // let saved = map.map.exportForSave();
    // let userMap = map.map.exportForLocalSave();
    console.log(`name passed to saveAs: "${name}"`);
    if (name) {
      // saved.level_name = name;
      // saved.user_id = 1;
      // axios
      //   .post("/maps", saved)
      //   .then((data: any) => {
      //     console.log(data.data);
      //     let { id } = data.data;
      //     map.mapId = id;
      //     this.saved = true;
      //     console.log(`Saved new map #${id}!`);
      //   })
      //   .catch((err: any) => console.error(err));

      // userMap.name = name;

      // map.map.name = name;
      map.map
        .saveNewMapAsync(name)
        .then((x: any) => {
          this.saved = true;
          if (this.quitting) this._game.publish("quit");
           else map.name = name;
        })
        .catch((err: Error) => console.error(err));
    }
  }

  openLoadSavedModal() {
    window.toggleModal(true, "loadMap");
  }

  async loadSaved(levelId: number) {
    // let id = 0;
    levelId = Number(levelId);
    if (levelId) {
      let global = this._game.ecs.getEntity("global").Global;
      // axios
      //   .get(`/maps/${levelId}`)
      //   .then((data: any) => {
      //     console.log(data.data);
      //     global.map.Map.mapId = levelId;
      //     global.map.Map.map = SandboxMap.fromMapObject(data.data);
      //     global.map.TileMap.tiles = global.map.Map.map.generateDesignTileMap();
      //     this._editor.restart();
      //   })
      //   .catch((err: any) => console.error(err));
      try {
        let savedMap = await loadUserMap(levelId);
        if (!savedMap)
          throw new Error(`There is no user map with id ${levelId}`);
        let decompressed = savedMap.decompress();
        let mapEntity = this._game.ecs.getEntity("map");
        mapEntity.Map.mapId = levelId;
        mapEntity.Map.name = decompressed.name;
        // mapEntity.Map.map = SandboxMap.fromUserMapObject(decompressed);
        mapEntity.Map.map = decompressed;
        mapEntity.TileMap.tiles = mapEntity.Map.map.generateDesignTileMap();
        this._editor.restart();
      } catch (err) {
        console.error(err);
      }
    }
    // this.setDesignTool("");
  }

  undo() {
    this._editor.undo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateDesignTileMap();
  }

  redo() {
    this._editor.redo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateDesignTileMap();
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
    let mapEntity = this._game.ecs.getEntity("map");

    if (resetChoice === "save") {
      this.save();
      this.clearMap();
    }

    if (resetChoice === "overwrite") {
      if (mapEntity.Map.mapId) this.deleteMap(mapEntity.Map.mapId);
      else this.clearMap();
    }

    this._editor.restart();
    this.saved = true;
  }

  clearMap() {
    let mapEntity = this._game.ecs.getEntity("map");
    mapEntity.Map.map.clear(this._editor);
    mapEntity.TileMap.tiles = mapEntity.Map.map.generateDesignTileMap();

    mapEntity.Map.mapId = null;
    mapEntity.Map.name = "";
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
