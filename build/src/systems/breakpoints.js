import EntityComponentSystem from "@fritzy/ecs";
import { centerWithin } from "gameMath";
import { SandboxMap } from "../state/map";
export class BreakpointSystem extends EntityComponentSystem.System {
    constructor(_game, ecs) {
        super(ecs);
        this._game = _game;
        this.bpData = {};
        this.bp = "regular";
        this.prevBP = "";
        this.prevGroupSize = 0;
    }
    update(tick, entities) {
        this.bp = this._game.breakpoint;
        for (let entity of entities) {
            let { Breakpoint, Renderable } = entity;
            this.setBreakpoint(Breakpoint);
            if (entity.has("Car")) {
                Renderable.renderW = 25 * (2 / 3) * this.bpData.scale;
                Renderable.renderH = 25 * (2 / 3) * this.bpData.scale;
            }
            else {
                Renderable.renderW = this.bpData.width;
                Renderable.renderH = this.bpData.height;
            }
            Renderable.breakpointScale = this.bpData.scale;
            if (entity.has("Text")) {
                entity.Text.textRenderW =
                    this.bp === "small"
                        ? entity.Text.textSpriteW
                        : entity.Text.textSpriteW / 0.76;
                entity.Text.textRenderH =
                    this.bp === "small"
                        ? entity.Text.textSpriteH
                        : entity.Text.textSpriteH / 0.76;
            }
            if (entity.id === "map") {
                this.handleMapBreakpoint(entity);
            }
        }
        this.prevBP = this.bp;
        this.prevGroupSize = entities.size;
    }
    setBreakpoint(bpSet) {
        let found = false;
        for (let b of bpSet) {
            if (b.name === this.bp) {
                this.bpData = b;
                found = true;
                break;
            }
        }
        if (!found)
            throw new Error(`Attempting to use an undefined breakpoint with name "${this.bp}"`);
    }
    handleMapBreakpoint(mapEntity) {
        let { Renderable: { renderW, renderH }, TileData, Border, Coordinates, MapData: { map } } = mapEntity;
        TileData.tileWidth = this.bpData.tileSize;
        TileData.tileHeight = this.bpData.tileSize;
        Border.weight = renderW * 0.02;
        Border.radius = renderW * 0.02;
        // if (!visible) return;
        let { x, y } = centerWithin(0, 0, window.innerWidth, window.innerHeight, renderW, renderH);
        if (map instanceof SandboxMap)
            y += y / 3;
        Coordinates.X = x;
        Coordinates.Y = y;
    }
}
BreakpointSystem.query = {
    has: ["Breakpoint", "Renderable"],
};
