import { Entity } from "@fritzy/ecs";
import { capitalize } from "../modules/gameHelpers";

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
  private game: any;
  public saved: boolean;
  //   public mapEntity: Entity;
  public gridLoaded: boolean;
  public gridOverlay: HTMLImageElement;
  public selectedTool: Tool;

  constructor(game: any) {
    this.game = game;
    this.saved = true;
    this.selectedTool = "";
    this.gridLoaded = false;
    this.gridOverlay = new Image();
    this.gridOverlay.src = "../design-grid.png";

    this.gridOverlay.onload = () => {
      this.gridLoaded = true;
    };
  }

  editDesign() {
      console.log("edit design running with tool: ", this.selectedTool)
    if (!this.selectedTool) return;
    let global = this.game.ecs.getEntity("global").Global;
    let mx = global.inputs.mouseX;
    let my = global.inputs.mouseY;
    let mapEntity = global.map;
    let designMap = mapEntity.Map.map;
    let newTileIndex, newTileValue;
    //find which square was clicked
    let square = designMap.getSquareByCoords(mx - mapEntity.Coordinates.X, my - mapEntity.Coordinates.Y);

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
        square,
        this.selectedTool
    );

    //update tile map on map entity
    tileChanges.forEach((change: Array<string|number>) => {
        let [index, tile] = change;
        let oldTileValue = mapEntity.TileMap.tiles[index];
        if (JSON.stringify(oldTileValue) !== JSON.stringify(tile)) {
          mapEntity.TileMap.tiles[index] = tile;
          //update save state
          this.saved = false;
        }
    })
  }
}

export default DesignModule;
