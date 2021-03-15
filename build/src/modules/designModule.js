var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { capitalize } from "gameHelpers";
import Editor, { commands } from "./editor";
import { deleteUserMap, loadUserMap } from "../state/localDb";
class DesignModule {
    constructor(game) {
        this._game = game;
        this._editor = new Editor(game);
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
        for (let command in commands) {
            this._editor.addCommand(command, commands[command]);
        }
    }
    setDesignTool(tool) {
        this.selectedTool = tool;
        this.mapCursor = tool ? "cell" : "default";
        this._game.publish("focusSelector", "button", this._game.ecs.getEntity(`${tool}Button`));
    }
    setMapCursor() {
        if (this.selectedTool !== "coffee" && this.selectedTool !== "light") {
            this.mapCursor = "cell";
            return;
        }
        let { inputs: { mouseX, mouseY }, } = this._game.ecs.getEntity("global").Global;
        let { MapData: { map }, Coordinates: { X, Y } } = this._game.ecs.getEntity("map");
        let square = map.getSquareByCoords(mouseX - X, mouseY - Y);
        if (square.drivable && !map.isKeySquare(square.id))
            this.mapCursor = "cell";
        else
            this.mapCursor = "no-drop";
    }
    editDesign() {
        if (!this.selectedTool)
            return;
        let global = this._game.ecs.getEntity("global").Global;
        let { MapData: { map }, TileData, Coordinates, Renderable: { breakpointScale }, } = this._game.ecs.getEntity("map");
        let mx = global.inputs.mouseX;
        let my = global.inputs.mouseY;
        //find which square was clicked
        let square = map.getSquareByCoords((mx - Coordinates.X) / breakpointScale, (my - Coordinates.Y) / breakpointScale);
        //perform design map action on that square
        if (!square) {
            console.log(`You tried to edit a square at coordinates (${mx}x${my}) but there is no valid square there.`);
            return;
        }
        if (this.dragging && square.id == this.lastEditedSquare)
            return;
        if (this.dragging &&
            (this.selectedTool === "light" || this.selectedTool === "coffee"))
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
        if (!this.dragging)
            this._editor.beginGroup();
        const tileChanges = map[`handle${actionType}Action`](this._editor, square, this.dragging, this.selectedTool);
        if (!this.dragging)
            this._editor.endGroup();
        //handle resulting changes to tile map
        let { tiles } = TileData;
        tileChanges.forEach((id) => {
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
        let { MapData: { map }, } = this._game.ecs.getEntity("map");
        if (!this.verifyValidMap())
            this.openInvalidMapModal();
        else if (map === null || map === void 0 ? void 0 : map.id) {
            map
                .saveMapAsync()
                .then((result) => {
                this.saved = true;
                if (this.quitting)
                    this._game.publish("quit");
            })
                .catch((err) => console.error(err));
        }
        else {
            this.openSaveAsModal();
        }
    }
    verifyValidMap() {
        let { MapData: { map }, } = this._game.ecs.getEntity("map");
        return map.hasAllKeySquares();
    }
    openSaveAsModal() {
        if (!this.verifyValidMap())
            this.openInvalidMapModal();
        else
            window.toggleModal(true, "save");
    }
    openInvalidMapModal() {
        window.toggleModal(true, "missingKeySquares");
    }
    saveAsAsync(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let { MapData: { map }, } = this._game.ecs.getEntity("map");
            if (name) {
                yield map.saveNewMapAsync(name);
                this.saved = true;
                if (this.quitting)
                    this._game.publish("quit");
                else
                    map.name = name;
            }
        });
    }
    openLoadSavedModal() {
        window.toggleModal(true, "loadMap");
    }
    loadSaved(levelId) {
        return __awaiter(this, void 0, void 0, function* () {
            levelId = Number(levelId);
            if (levelId) {
                try {
                    let savedMap = yield loadUserMap(levelId);
                    if (!savedMap)
                        throw new Error(`There is no user map with id ${levelId}`);
                    let decompressed = savedMap.decompress();
                    let { MapData, TileData } = this._game.ecs.getEntity("map");
                    MapData.map = decompressed;
                    TileData.tiles = MapData.map.generateDesignTileMap();
                    this._editor.restart();
                }
                catch (err) {
                    console.error(err);
                }
            }
        });
    }
    undo() {
        this._editor.undo();
        let { TileData, MapData: { map }, } = this._game.ecs.getEntity("map");
        TileData.tiles = map.generateDesignTileMap();
    }
    redo() {
        this._editor.redo();
        let { TileData, MapData: { map }, } = this._game.ecs.getEntity("map");
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
        let conf = window.confirm("You currently have unsaved changes. Are you sure you want to exit?\n\nPress OK to discard changes and go home. Press Cancel to return to design.");
        this.saved = conf;
    }
    openResetModal() {
        window.toggleModal(true, "reset");
    }
    resetMap(resetChoice) {
        let { MapData: { map }, } = this._game.ecs.getEntity("map");
        if (resetChoice === "save") {
            if (!this.saved)
                this.save();
            this.clearMap();
        }
        if (resetChoice === "overwrite") {
            if (map === null || map === void 0 ? void 0 : map.id)
                this.deleteMap(map.id);
            else
                this.clearMap();
        }
        this._editor.restart();
        this.saved = true;
    }
    clearMap() {
        let { MapData: { map }, TileData, } = this._game.ecs.getEntity("map");
        map.clear(this._editor);
        TileData.tiles = map.generateDesignTileMap();
        map.id = null;
        map.name = "";
    }
    deleteMap(id) {
        deleteUserMap(id)
            .then((r) => {
            this.clearMap();
        })
            .catch((err) => console.error(err));
    }
}
export default DesignModule;
