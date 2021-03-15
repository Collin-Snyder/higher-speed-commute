import EntityComponentSystem from "@fritzy/ecs";
import { centerWithin, degreesToRadians } from "gameMath";
import { capitalize } from "gameHelpers";
const { abs } = Math;
class RenderTopLevelGraphics extends EntityComponentSystem.System {
    constructor(_game, ecs, ctx) {
        super(ecs);
        this._game = _game;
        this.ctx = ctx;
        this.toolTipCanvases = {};
        this.toolTipSprites = {
            corner: this._game.spriteMap.getSprite("tooltipCorner"),
            edge: this._game.spriteMap.getSprite("tooltipEdge"),
            middle: this._game.spriteMap.getSprite("tooltipMiddle"),
            carat: this._game.spriteMap.getSprite("tooltipCarat"),
        };
        this.toolTipEdges = {
            leftEdgeX: 0,
            rightEdgeX: 0,
            topEdgeY: 0,
            bottomEdgeY: 0,
        };
        this.toolTipCaratCoordinates = { X: 0, Y: 0 };
        this.toolTipPadding = 6;
    }
    update(tick, entities) {
        //will render countdown numbers
        for (let entity of entities) {
            let { x, y } = centerWithin(0, 0, window.innerWidth, window.innerHeight, entity.Renderable.renderW, entity.Renderable.renderH);
            entity.Coordinates.X = x;
            entity.Coordinates.Y = y;
            this.ctx.save();
            this.ctx.globalAlpha = entity.Renderable.alpha;
            this.ctx.drawImage(this._game.spriteSheet, entity.Renderable.spriteX, entity.Renderable.spriteY, entity.Renderable.spriteW, entity.Renderable.spriteH, entity.Coordinates.X, entity.Coordinates.Y, entity.Renderable.renderW, entity.Renderable.renderH);
            this.ctx.restore();
        }
        if (this._game.mode === "designing")
            this.renderSelectors();
        this.renderTooltips();
    }
    renderSelectors() {
        let selectors = this.ecs.queryEntities({
            has: ["Selector", "Renderable", "Coordinates"],
        });
        for (let entity of selectors) {
            if (!entity.Selector.focusEntity)
                continue;
            let { Selector: { style, focusEntity, gap }, Renderable, Coordinates, } = entity;
            if (this._game.breakpoint === "small")
                gap = 12;
            let selectorWidth = focusEntity.Renderable.renderW + gap * 2;
            let selectorHeight = focusEntity.Renderable.renderH + gap * 2;
            let buttonX = focusEntity.Coordinates.X;
            let buttonY = focusEntity.Coordinates.Y;
            let sprite = (this._game.spriteMap.getSprite(`${style}Selector${capitalize(this._game.breakpoint)}`));
            Renderable.renderW = sprite.w;
            Renderable.renderH = sprite.h;
            Coordinates.X += (buttonX - gap - Coordinates.X) * (1 / 3);
            Coordinates.Y += (buttonY - gap - Coordinates.Y) * (1 / 3);
            let UL = {
                x: Coordinates.X,
                y: Coordinates.Y,
                deg: 0,
            };
            let UR = {
                x: Coordinates.X + selectorWidth - Renderable.renderW,
                y: Coordinates.Y,
                deg: 90,
            };
            let DR = {
                x: UR.x,
                y: Coordinates.Y + selectorHeight - Renderable.renderW,
                deg: 180,
            };
            let DL = {
                x: UL.x,
                y: DR.y,
                deg: 270,
            };
            let corners = [UL, UR, DR, DL];
            for (let corner of corners) {
                this.ctx.save();
                let transX = Math.floor(corner.x + Renderable.renderW / 2);
                let transY = Math.floor(corner.y + Renderable.renderH / 2);
                this.ctx.translate(transX, transY);
                this.ctx.rotate(degreesToRadians(corner.deg));
                this.ctx.translate(-transX, -transY);
                this.ctx.drawImage(this._game.spriteSheet, sprite.x, sprite.y, sprite.w, sprite.h, Math.floor(corner.x), Math.floor(corner.y), Math.floor(Renderable.renderW), Math.floor(Renderable.renderH));
                this.ctx.restore();
            }
        }
    }
    renderTooltips() {
        let tooltipEntities = this.ecs.queryEntities({
            has: ["Tooltip", "Renderable", "Coordinates"],
        });
        if (!tooltipEntities.size)
            return;
        for (let entity of tooltipEntities) {
            let { Tooltip: { text, textSize, opacity }, Coordinates: { X, Y }, Renderable: { renderW, renderH } } = entity;
            this.ctx.save();
            this.ctx.font = `${textSize}px '${this._game.gameFont.family}'`;
            // this.ctx.textBaseline = "bottom";
            this.ctx.fillStyle = "#000";
            this.ctx.globalAlpha = opacity;
            let { width, actualBoundingBoxDescent, actualBoundingBoxLeft, actualBoundingBoxRight, actualBoundingBoxAscent, } = this.ctx.measureText(text);
            if (!this.toolTipCanvases[entity.id])
                this.toolTipCanvases[entity.id] = this.constructTooltipBubble(width, actualBoundingBoxAscent);
            let tooltip = this.toolTipCanvases[entity.id];
            let tooltipX = Math.floor(X + (renderW / 2) - (tooltip.width / 2));
            let tooltipY = Math.floor(Y + renderH);
            this.ctx.drawImage(tooltip, tooltipX, tooltipY, tooltip.width, tooltip.height);
            // this.ctx.drawImage(tooltipBubble, 0, 0, tooltipBubble.width, tooltipBubble.height, 0, 0, tooltipBubble.width * 10, tooltipBubble.height * 10)
            let textCoords = centerWithin(tooltipX, tooltipY + 8, tooltip.width, tooltip.height - 8, width, actualBoundingBoxAscent);
            this.ctx.fillText(text, textCoords.x, textCoords.y + actualBoundingBoxAscent);
            this.ctx.restore();
        }
    }
    constructTooltipBubble(textW, textH) {
        let canvas = document.createElement("canvas");
        let paddingH = textH + this.toolTipPadding;
        let paddingW = textW + this.toolTipPadding;
        let height = Math.max(16, paddingH + (8 - (paddingH % 8)));
        height += 8; //for the carat
        let width = Math.max(24, paddingW + (8 - paddingW % 8));
        if ((width / 8) % 2 === 0)
            width += 8; //so the carat is centered
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        this.toolTipCaratCoordinates = { X: width / 2 - 4, Y: 0 };
        this.toolTipEdges.topEdgeY = 8;
        this.toolTipEdges.bottomEdgeY = height - 8;
        this.toolTipEdges.leftEdgeX = 0;
        this.toolTipEdges.rightEdgeX = width - 8;
        let tileCount = (width / 8) * (height / 8);
        let x = 0, y = 0;
        let currTile = 0;
        while (currTile < tileCount) {
            let { type, deg } = this.generateTooltipTile(x, y);
            if (type) {
                let sprite = this.toolTipSprites[type];
                if (deg) {
                    ctx.save();
                    let transX = x + 4;
                    let transY = y + 4;
                    ctx.translate(transX, transY);
                    ctx.rotate(degreesToRadians(deg));
                    ctx.translate(-transX, -transY);
                }
                ctx.drawImage(this._game.spriteSheet, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
                if (deg)
                    ctx.restore();
            }
            x += 8;
            if (x >= width) {
                x = 0;
                y += 8;
            }
            currTile++;
        }
        return canvas;
    }
    generateTooltipTile(x, y) {
        let { leftEdgeX, rightEdgeX, topEdgeY, bottomEdgeY } = this.toolTipEdges;
        if (x === this.toolTipCaratCoordinates.X &&
            y === this.toolTipCaratCoordinates.Y)
            return { type: "carat", deg: 0 };
        if (y === this.toolTipCaratCoordinates.Y)
            return { type: "", deg: 0 };
        if (y === topEdgeY && x === this.toolTipCaratCoordinates.X)
            return { type: "", deg: 0 };
        if (x === leftEdgeX && y === topEdgeY)
            return { type: "corner", deg: 0 };
        if (x === rightEdgeX && y === topEdgeY)
            return { type: "corner", deg: 90 };
        if (x === rightEdgeX && y === bottomEdgeY)
            return { type: "corner", deg: 180 };
        if (x === leftEdgeX && y === bottomEdgeY)
            return { type: "corner", deg: 270 };
        if (x === leftEdgeX)
            return { type: "edge", deg: 270 };
        if (x === rightEdgeX)
            return { type: "edge", deg: 90 };
        if (y === topEdgeY)
            return { type: "edge", deg: 0 };
        if (y === bottomEdgeY)
            return { type: "edge", deg: 180 };
        return { type: "middle", deg: 0 };
    }
}
RenderTopLevelGraphics.query = {
    has: ["Coordinates", "Renderable", "anim"],
};
export default RenderTopLevelGraphics;
