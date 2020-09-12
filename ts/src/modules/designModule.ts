import { Entity } from "@fritzy/ecs";
//@ts-ignore
import axios from "axios";
import { capitalize } from "../modules/gameHelpers";
import { centerWithin } from "../modules/gameMath";
import { DesignMapGrid } from "../state/map";
import Editor, { commands } from "./editor";
import { DisabledButtons } from "../buttonModifiers";
import { DesignMenuName, ButtonInterface } from "../state/menuButtons";
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

        if (saveBtn.has("Disabled")) {
          console.log("Re-enabling save button");
          saveBtn.removeComponentByType("Disabled");
        }
      }
    });
    this.lastEditedSquare = square.id;
  }

  save() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    let saved = map.map.exportForSave();

    if (map.mapId) {
      axios
        .put(`/map/${map.mapId}`, saved)
        .then((data: any) => {
          console.log(data.data);
          this.saved = true;
          let saveBtn = global.game.ecs.getEntity("saveButton");
          if (!saveBtn.has("Disabled"))
            saveBtn.addComponent("Disabled", DisabledButtons.save);
        })
        .catch((err: any) => {
          console.error(err);
        });
    } else {
      this.saveAs();
    }
  }

  saveAs() {
    let global = this._game.ecs.getEntity("global").Global;
    let map = global.map.Map;
    let saved = map.map.exportForSave();
    let name = window.prompt("Please enter a name for your map");
    if (name) {
      saved.level_name = name;
      saved.user_id = 1;

      axios
        .post("/map", saved)
        .then((data: any) => {
          let { id } = data.data;
          map.mapId = id;
          this.saved = true;
          console.log(`Saved new map #${id}!`);
        })
        .catch((err: any) => console.error(err));
    }
  }

  loadSaved() {
    let id = window.prompt("Please enter a level ID to edit");
    if (id) {
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
    }
    // this.setDesignTool("");
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

  confirmUnsaved() {
    let conf = window.confirm(
      "You currently have unsaved changes. Are you sure you want to exit?\n\nPress OK to discard changes and go home. Press Cancel to return to design."
    );
    this.saved = conf;
  }

  resetMap() {
    let confirmReset = window.confirm(
      "Are you sure you want to reset the map? This action cannot be undone."
    );

    if (!confirmReset) return;

    let confirmOverwrite = window.confirm(
      "Press OK to reset your existing map. This will overwrite your existing map and cannot be undone.\n\nPress Cancel to create a new map. This will preserve the last saved version of the current map and generate a new, blank one."
    );

    let mapEntity = this._game.ecs.getEntity("map");

    mapEntity.Map.map.clear(this._editor);
    mapEntity.TileMap.tiles = mapEntity.Map.map.generateTileMap();

    if (confirmOverwrite) this.save();
    else mapEntity.Map.mapId = null;

    this._editor.restart();
    this.saved = true;
  }

  makeButtonEntity(button: ButtonInterface) {
    let coords = this._game.ecs.getEntity("global").Global.spriteMap[
      `${button.name}Button`
    ];

    return this._game.ecs.createEntity({
      id: `${button.name}Button`,
      Button: { name: button.name },
      Clickable: { onClick: button.onClick },
      Coordinates: {},
      Renderable: {
        spriteX: coords.X,
        spriteY: coords.Y,
        spriteWidth: button.width,
        spriteHeight: button.height,
        renderWidth: button.width,
        renderHeight: button.height,
      },
    });
  }

  createButtons() {
    //create all button entities in ecs
    const btns: { toolbar: Entity[]; admin: Entity[]; config: Entity[] } = {
      toolbar: [],
      admin: [],
      config: [],
    };
    const designButtons = this._game.menuButtons.design;

    for (let key in designButtons) {
      let menu = <DesignMenuName>key;
      if (menu !== "config") {
        for (let obj of designButtons[menu]) {
          let button = <ButtonInterface>obj;
          let btnEntity = this.makeButtonEntity(button);
          btnEntity.addTag("menu");
          btnEntity.addTag("design");
          btnEntity.addTag(menu);
          btns[menu].push(btnEntity);
        }
      }
    }

    return btns;
  }

  organizeToolbarButtons(toolbarBtns?: Entity[]) {
    if (!toolbarBtns) {
      toolbarBtns = <Array<Entity>>this._game.ecs.queryEntities({
        has: ["menu", "design", "toolbar"],
      });
    }
    //run centering/alignment logic for toolbar buttons
    const canvasWidth = this._game.UICanvas.width;
    const canvasHeight = this._game.UICanvas.height;
    const mapEntity = this._game.ecs.getEntity("map");
    const mapWidth = mapEntity.Map.map.pixelWidth;
    const mapHeight = mapEntity.Map.map.pixelHeight;
    const mapX = mapEntity.Coordinates.X;
    const mapY = mapEntity.Coordinates.Y;
    const cx = mapX;
    const cy = 0;
    const cw = mapWidth;
    const ch = (canvasHeight - mapHeight) / 2;
    const ew = toolbarBtns[0].Renderable.renderWidth;
    const eh = toolbarBtns[0].Renderable.renderHeight;
    const n = toolbarBtns.length;

    let { x, y } = centerWithin(cx, cy, cw, ch, ew, eh, n, "horizontal");

    //add coordinates to each button entity
    let newX = x.start;
    for (let btn of toolbarBtns) {
      btn.Coordinates.Y = y.start;
      btn.Coordinates.X = newX;
      newX += x.step;
    }
  }

  organizeAdminButtons(adminBtns?: Entity[]) {
    if (!adminBtns) {
      adminBtns = <Array<Entity>>this._game.ecs.queryEntities({
        has: ["menu", "design", "admin"]
      });
    }
    console.log("Formatting undo redo buttons")
    const undoredo = adminBtns.filter((b) => b.Button.name === "undo" || b.Button.name === "redo");
    const erasereset = adminBtns.filter((b) => b.Button.name === "eraser" || b.Button.name === "reset");
    let btns: Array<Entity|Array<Entity>> = adminBtns.slice();
    btns.splice(4, 2, undoredo);
    btns.splice(5, 2, erasereset);

    //run centering/alignment logic for admin buttons
    const canvasWidth = this._game.UICanvas.width;
    const canvasHeight = this._game.UICanvas.height;
    const mapEntity = this._game.ecs.getEntity("map");
    const mapWidth = mapEntity.Map.map.pixelWidth;
    const mapHeight = mapEntity.Map.map.pixelHeight;
    const mapX = mapEntity.Coordinates.X;
    const mapY = mapEntity.Coordinates.Y;
    const cx = mapX + mapWidth;
    const cy = (canvasHeight - mapHeight) / 2;
    const cw = (canvasWidth - mapWidth) / 2;
    const ch = mapHeight;
    const ew = adminBtns[0].Renderable.renderWidth;
    const eh = adminBtns[0].Renderable.renderHeight;
    const n = adminBtns.length;

    // let { x, y } = 
    this.centerButtons(cx, cy, cw, ch, ew, eh, "vertical", btns);

    //add coordinates to each button entity
    // let newX = x.start;
    // for (let btn of adminBtns) {
    //   btn.Coordinates.Y = y.start;
    //   btn.Coordinates.X = newX;
    //   newX += x.step;
    // }
  }

  organizeConfigButtons(configBtns?: Entity[]) {
    if (!configBtns) {
      configBtns = this._game.ecs.queryEntities({
        has: ["menu", "design", "config"],
      });
    }
  }

  organizeDesignMenus(designBtns?: {
    toolbar: Entity[];
    admin: Entity[];
    config?: Entity[];
  }) {
    if (!designBtns) {
      designBtns = {
        toolbar: this._game.ecs.queryEntities({
          has: ["menu", "design", "toolbar"],
        }),
        admin: this._game.ecs.queryEntities({
          has: ["menu", "design", "admin"]
        }),
        // config: this._game.ecs.queryEntities({
        //   has: ["menu", "design", "config"],
        // }),
      };
    }

    this.organizeToolbarButtons(designBtns.toolbar);
    this.organizeAdminButtons(designBtns.admin);
    // this.organizeConfigButtons(designBtns.config);
  }

  createDesignMenus() {
    //run createButtons to return buckets of button entities
    const designButtons = this.createButtons();
    //run organize menu buttons for each bucket of buttons
    this.organizeDesignMenus(designButtons);
  }

  centerButtons(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    ew: number,
    eh: number,
    dir: "horizontal" | "vertical",
    buttons: Array<Entity | Array<Entity>>,
    style: "spaceBetween" | "spaceEvenly" = "spaceEvenly"
  ) {
    let {x, y} = centerWithin(cx, cy, cw, ch, ew, eh, buttons.length, dir, style);

    let newCoord = dir === "horizontal" ? x.start : y.start;
    for (let btn of buttons) {
      if (Array.isArray(btn)) {
        console.log("Detected subarray and running recursion")
        let subx = dir === "horizontal" ? newCoord : x.start;
        let suby = dir === "vertical" ? newCoord : y.start;
        let subw = dir === "horizontal" ? x.step : ew;
        let subh = dir === "vertical" ? y.step : eh;
        let subew = btn[0].Renderable.renderWidth;
        let subeh = btn[0].Renderable.renderHeight;
        this.centerButtons(subx, suby, subw, subh, subew, subeh, dir === "horizontal" ? "vertical" : "horizontal", btn, "spaceBetween");
      } else {
        btn.Coordinates.Y = dir === "vertical" ? newCoord : y.start;
        btn.Coordinates.X = dir === "horizontal" ? newCoord : x.start;
      }
      if (dir === "vertical") newCoord += y.step;
      else if (dir === "horizontal") newCoord += x.step;
    }
  }
}

export default DesignModule;
