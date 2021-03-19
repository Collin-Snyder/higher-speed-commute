import { capitalize, openModal } from "gameHelpers";
import editorCommands from "../staticData/editorCommands";
import MapEditorService from "./mapEditorService";
import { deleteUserMap, loadUserMap } from "../localDb";

class DesignModule {
    private _game: any;
    private _editor: MapEditorService;
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
      this._editor = new MapEditorService(game);
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
  
      for (let command in editorCommands) {
        this._editor.addCommand(command, editorCommands[command]);
      }
    }
  
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
        MapData: { map },
        Coordinates: {X, Y}
      } = this._game.ecs.getEntity("map");
  
      let square = map.getSquareByCoords(mouseX - X, mouseY - Y);
  
      if (square.drivable && !map.isKeySquare(square.id)) this.mapCursor = "cell";
      else this.mapCursor = "no-drop";
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
  
      //find which square was clicked
      let square = map.getSquareByCoords(
        (mx - Coordinates.X) / breakpointScale,
        (my - Coordinates.Y) / breakpointScale
      );
  
      //perform design map action on that square
      if (!square) {
        console.error(
          new Error(`You tried to edit a square at coordinates (${mx}x${my}) but there is no valid square there.`)
        );
        return;
      }
  
      if (this.dragging && square.id == this.lastEditedSquare) return;
      if (
        this.dragging &&
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
  
      if (!this.dragging) this._editor.beginGroup();
      const tileChanges = map[`handle${actionType}Action`](
        this._editor,
        square,
        this.dragging,
        this.selectedTool
      );
      if (!this.dragging) this._editor.endGroup();
  
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
  
      if (!this.verifyValidMap()) this.openInvalidMapModal();
      else if (map?.id) {
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
  
    verifyValidMap() {
      let {
        MapData: { map },
      } = this._game.ecs.getEntity("map");
  
      return map.hasAllKeySquares();
    }
  
    openSaveAsModal() {
      if (!this.verifyValidMap()) this.openInvalidMapModal();
      else openModal("save");
    }
  
    openInvalidMapModal() {
      openModal("missingKeySquares");
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
      openModal("loadMap");
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
      this.dragging = true;
      this._editor.usePrevGroup();
      this._editor.beginGroup();
    }
  
    stopDrawing() {
      this.dragging = false;
      this._editor.endGroup();
    }
  
    confirmUnsaved() {
      let conf = window.confirm(
        "You currently have unsaved changes. Are you sure you want to exit?\n\nPress OK to discard changes and go home. Press Cancel to return to design."
      );
      this.saved = conf;
    }
  
    openResetModal() {
      openModal("reset");
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