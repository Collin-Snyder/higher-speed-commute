import { Entity } from "@fritzy/ecs";
//@ts-ignore
import axios from "axios";
import { capitalize } from "../modules/gameHelpers";
import { DesignMapGrid } from "../state/map";
import Commander, { commands } from "./commander";

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
  private _commander: Commander;
  public saved: boolean;
  //   public mapEntity: Entity;
  public gridLoaded: boolean;
  public gridOverlay: HTMLImageElement;
  public selectedTool: Tool;

  constructor(game: any) {
    this._game = game;
    this._commander = new Commander(game);
    this.saved = true;
    this.selectedTool = "";
    this.gridLoaded = false;
    this.gridOverlay = new Image();
    this.gridOverlay.src = "../design-grid.png";

    this.gridOverlay.onload = () => {
      this.gridLoaded = true;
    };

    for (let command in commands) {
        this._commander.addCommand(command, commands[command]);
    }
  }

  editDesign() {
    console.log("edit design running with tool: ", this.selectedTool);
    if (!this.selectedTool) return;
    let global = this._game.ecs.getEntity("global").Global;
    let mx = global.inputs.mouseX;
    let my = global.inputs.mouseY;
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
    const tileChanges = designMap[`handle${actionType}Action`](
      this._commander,
      square,
      this.selectedTool
    );

    //handle resulting changes to tile map
    let tiles = mapEntity.TileMap.tiles;
    tileChanges.forEach((id: number) => {
      let index = id - 1;
      let oldTile = tiles[index];
      let newTile = designMap.determineTileValue(id);
      if (oldTile !== newTile) {
        tiles[index] = newTile;
        this.saved = false;
      }
    });

    //update tile map on map entity
    // tileChanges.forEach((change: Array<string | number>) => {
    //   let [index, tile] = change;
    //   let oldTileValue = mapEntity.TileMap.tiles[index];
    //   if (JSON.stringify(oldTileValue) !== JSON.stringify(tile)) {
    //     mapEntity.TileMap.tiles[index] = tile;
    //     //update save state
    //     this.saved = false;
    //   }
    // });
  }

  save() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    let saved = map.map.exportForSave();
    axios
      .put(`/map/${map.mapId}`, saved)
      .then((data: any) => {
        console.log(data.data);
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
    saved.level_name = name;
    saved.user_id = 1;
    //axios post to server
    axios
      .post("/map", saved)
      .then((data: any) => {
        let { id } = data.data;
        map.mapId = id;
        console.log(`Saved new map #${id}!`);
      })
      .catch((err: any) => console.error(err));
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
      })
      .catch((err: any) => console.error(err));
  }

  undo() {
      console.log("registering undo action in designModule")
    this._commander.undo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateTileMap();
  }

  redo() {
    console.log("registering redo action in designModule")
    this._commander.redo();
    let global = this._game.ecs.getEntity("global").Global;
    global.map.TileMap.tiles = global.map.Map.map.generateTileMap();
  }
}

export default DesignModule;
