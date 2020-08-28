import { Entity } from "@fritzy/ecs";
//@ts-ignore
import axios from "axios";
import { capitalize } from "../modules/gameHelpers";
import { DesignMapGrid } from "../state/map";
import Editor, { commands } from "./editor";
import { DisabledButtons } from "../buttonModifiers";
import Game from "../main";

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
      let oldTile = tiles[index];
      let newTile = designMap.determineTileValue(id);
      if (oldTile !== newTile) {
        tiles[index] = newTile;
        this.saved = false;
        let saveBtn = this._game.ecs.getEntity("saveButton");
        let saveAsBtn = this._game.ecs.getEntity("saveAsButton");
        if (mapEntity.Map.mapId && saveBtn.has("Disabled"))
          saveBtn.removeComponentByType("Disabled");
        if (saveAsBtn.has("Disabled"))
          saveBtn.removeComponentByType("Disabled");
      }
    });
    this.lastEditedSquare = square.id;
  }

  save() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    let saved = map.map.exportForSave();

    axios
      .put(`/map/${map.mapId}`, saved)
      .then((data: any) => {
        console.log(data.data);
        let saveBtn = global.game.ecs.getEntity("saveButton");
        saveBtn.addComponent("Disabled", DisabledButtons.save);
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  saveAs() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    let saved = map.map.exportForSave();
    let name = window.prompt("Please enter a name for your map");
    if (!name) return;
    saved.level_name = name;
    saved.user_id = 1;

    axios
      .post("/map", saved)
      .then((data: any) => {
        let { id } = data.data;
        map.mapId = id;
        console.log(`Saved new map #${id}!`);
      })
      .catch((err: any) => console.error(err));

    this.setDesignTool("");
  }

  loadSaved() {
    let id = window.prompt("Please enter a level ID to edit");
    let global = this._game.ecs.getEntity("global").Global;
    axios
      .get(`/map/${id}`)
      .then((data: any) => {
        console.log(data.data);
        global.map.Map.mapId = id;
        global.map.Map.map = DesignMapGrid.fromMapObject(data.data);
        global.map.TileMap.tiles = global.map.Map.map.generateTileMap();
        this._editor.restart();
      })
      .catch((err: any) => console.error(err));

    this.setDesignTool("");
  }

  undo() {
    this._editor.undo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateTileMap();
  }

  redo() {
    this._editor.redo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateTileMap();
  }

  startDrawing() {
    this._editor.usePrevGroup();
    this._editor.beginGroup();
  }

  stopDrawing() {
    this._editor.endGroup();
  }
}

export default DesignModule;
