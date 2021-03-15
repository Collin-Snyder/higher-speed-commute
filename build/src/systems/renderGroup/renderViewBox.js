import EntityComponentSystem from "@fritzy/ecs";
import { getCenterPoint, degreesToRadians, } from "gameMath";
class RenderViewBox extends EntityComponentSystem.System {
    constructor(_game, ecs, ctx, step) {
        super(ecs);
        this._game = _game;
        this.ctx = ctx;
        this.step = step;
        this.playerEntity = this.ecs.getEntity("player");
        this.bossEntity = this.ecs.getEntity("boss");
        this.refColors = {
            playerHome: "#0058cf",
            player: "#007eff",
            bossHome: "#eb3626",
            boss: "#ff3600",
            office: "#f0d31a",
            street: "#878787",
        };
        this.modeNames = ["playing", "won", "levelStartAnimation"];
    }
    update(tick, entities) {
        let mode = this._game.mode;
        let zoom = this._game.currentZoom;
        let mapView = this._game.mapView;
        if (!this.modeNames.includes(mode))
            return;
        let mapEntity = entities.values().next().value;
        this.updateViewbox(mapEntity, this._game, mode);
        let { ViewBox, Coordinates, Renderable: { renderW, renderH }, MapData: { map }, TileData: { tileWidth }, } = mapEntity;
        let { X, Y } = Coordinates;
        if (mapView) {
            this.renderReferenceMap(map, X, Y, renderW, renderH, tileWidth, ViewBox, tick);
        }
        else {
            this.ctx.drawImage(document.getElementById("map-offscreen"), ViewBox.x, ViewBox.y, ViewBox.w, ViewBox.h, X, Y, renderW, renderH);
            this.ctx.drawImage(document.getElementById("ents-offscreen"), ViewBox.x, ViewBox.y, ViewBox.w, ViewBox.h, X, Y, renderW, renderH);
            if (mode === "levelStartAnimation")
                return;
            if (this.carInViewbox(this.bossEntity, ViewBox)) {
                this.renderCarSprite(this.bossEntity, this._game.spriteSheet, this._game.spriteMap, Coordinates, zoom, mapEntity);
            }
            if (this.carInViewbox(this.playerEntity, ViewBox)) {
                this.renderCarSprite(this.playerEntity, this._game.spriteSheet, this._game.spriteMap, Coordinates, zoom, mapEntity);
            }
            if (this._game.focusView === "boss") {
                this.drawBossBorder(X, Y, renderW, renderH);
            }
        }
    }
    updateViewbox(mapEntity, game, mode) {
        let { ViewBox } = mapEntity;
        let mapOffscreen = (document.getElementById("map-offscreen"));
        let focusEnt = this.ecs.getEntity(game.focusView);
        let { X, Y } = focusEnt.Coordinates;
        let center = getCenterPoint(X, Y, focusEnt.Renderable.renderW, focusEnt.Renderable.renderH);
        ViewBox.w = 1000 / game.currentZoom;
        ViewBox.h = 625 / game.currentZoom;
        let vbCenter = getCenterPoint(ViewBox.x, ViewBox.y, ViewBox.w, ViewBox.h);
        if (mode === "playing") {
            ViewBox.x += (center.X - vbCenter.X) * (1 / 8);
            ViewBox.y += (center.Y - vbCenter.Y) * (1 / 8);
        }
        else {
            ViewBox.x = center.X - ViewBox.w / 2;
            ViewBox.y = center.Y - ViewBox.h / 2;
        }
        if (ViewBox.x < 0)
            ViewBox.x = 0;
        if (ViewBox.y < 0)
            ViewBox.y = 0;
        if (ViewBox.x + ViewBox.w > mapOffscreen.width)
            ViewBox.x = mapOffscreen.width - ViewBox.w;
        if (ViewBox.y + ViewBox.h > mapOffscreen.height)
            ViewBox.y = mapOffscreen.height - ViewBox.h;
    }
    getCarRotationRadians(entity) {
        let { X, Y } = entity.Velocity.vector;
        if (X === 0 && Y === 0)
            return -1;
        if (X > 0 && Y < 0)
            return degreesToRadians(45);
        if (X > 0 && Y > 0)
            return degreesToRadians(135);
        if (X < 0 && Y > 0)
            return degreesToRadians(225);
        if (X < 0 && Y < 0)
            return degreesToRadians(315);
        if (Y < 0)
            return 0;
        if (X > 0)
            return degreesToRadians(90);
        if (Y > 0)
            return degreesToRadians(180);
        if (X < 0)
            return degreesToRadians(270);
        return -1;
    }
    renderCarSprite(entity, spriteSheet, spriteMap, mapCoords, zoomFactor, mapEntity) {
        let { ViewBox } = mapEntity;
        let { Coordinates, Renderable: { renderW, renderH, degrees, spriteX, spriteY, spriteW, spriteH, breakpointScale, }, } = entity;
        let X = Coordinates.X - ViewBox.x;
        let Y = Coordinates.Y - ViewBox.y;
        let dx = mapCoords.X + X * zoomFactor * breakpointScale;
        let dy = mapCoords.Y + Y * zoomFactor * breakpointScale;
        let dw = renderW * zoomFactor;
        let dh = renderH * zoomFactor;
        let trans = getCenterPoint(dx, dy, dw, dh);
        this.ctx.save();
        this.ctx.translate(trans.X, trans.Y);
        this.ctx.rotate(degreesToRadians(degrees));
        this.ctx.translate(-trans.X, -trans.Y);
        this.ctx.drawImage(spriteSheet, spriteX, spriteY, spriteW, spriteH, dx, dy, dw, dh);
        this.ctx.restore();
        // this.renderHitbox(entity, zoomFactor, breakpointScale, mapCoords, ViewBox, true);
    }
    renderHitbox(entity, zoomFactor, bpScale, mapCoords, viewbox, showFrontCorners = false) {
        let scaledHb = entity.Collision.currentHb().map((v) => ({
            X: mapCoords.X + (v.X - viewbox.x) * zoomFactor * bpScale,
            Y: mapCoords.Y + (v.Y - viewbox.y) * zoomFactor * bpScale,
        }));
        this.ctx.beginPath();
        this.ctx.moveTo(scaledHb[0].X, scaledHb[0].Y);
        for (let i = 0; i < scaledHb.length; i++) {
            let next = i + 1 === scaledHb.length ? scaledHb[0] : scaledHb[i + 1];
            this.ctx.lineTo(next.X, next.Y);
        }
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.stroke();
        if (!showFrontCorners)
            return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.fillStyle = "#FFFF00";
        this.ctx.arc(scaledHb[0].X, scaledHb[0].Y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.arc(scaledHb[1].X, scaledHb[1].Y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }
    carInViewbox(entity, vb) {
        for (let v of entity.Collision.currentHb()) {
            if (v.X < vb.x || v.Y < vb.y || v.X > vb.x + vb.w || v.Y > vb.y + vb.h)
                return false;
        }
        return true;
    }
    drawBossBorder(mapx, mapy, mapw, maph) {
        let weight = maph / 80;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.lineWidth = weight;
        this.ctx.strokeStyle = "#d83b39";
        this.ctx.moveTo(mapx, mapy);
        this.ctx.lineTo(mapx + mapw, mapy);
        this.ctx.lineTo(mapx + mapw, mapy + maph);
        this.ctx.lineTo(mapx, mapy + maph);
        this.ctx.lineTo(mapx, mapy);
        this.ctx.globalAlpha = 0.75;
        this.ctx.stroke();
        this.ctx.moveTo(mapx + weight / 2, mapy + weight / 2);
        this.ctx.lineTo(mapx + mapw - weight, mapy + weight);
        this.ctx.lineTo(mapx + mapw - weight, mapy + maph - weight);
        this.ctx.lineTo(mapx + weight, mapy + maph - weight);
        this.ctx.lineTo(mapx + weight / 2, mapy + weight / 2);
        this.ctx.globalAlpha = 0.5;
        this.ctx.stroke();
        this.ctx.moveTo(mapx + weight, mapy + weight);
        this.ctx.lineTo(mapx + mapw - 2 * weight, mapy + 2 * weight);
        this.ctx.lineTo(mapx + mapw - 2 * weight, mapy + maph - 2 * weight);
        this.ctx.lineTo(mapx + 2 * weight, mapy + maph - 2 * weight);
        this.ctx.lineTo(mapx + weight, mapy + weight);
        this.ctx.globalAlpha = 0.25;
        this.ctx.stroke();
        this.ctx.restore();
    }
    renderReferenceMap(map, mapx, mapy, mapw, maph, tileSize, vb, tick) {
        this.ctx.fillStyle = "#313131";
        this.ctx.fillRect(mapx, mapy, mapw, maph);
        let tiles = map.generateReferenceTileMap();
        let x = 0;
        let y = 0;
        let s = tileSize;
        for (let tile of tiles) {
            if (tile) {
                this.drawSquare(x * s + mapx, y * s + mapy, s, this.refColors[tile]);
            }
            if (++x >= map.width) {
                x = 0;
                y++;
            }
        }
        this.drawRefViewbox(vb, mapx, mapy);
        this.drawRefCar(this.bossEntity, mapx, mapy, tick);
        this.drawRefCar(this.playerEntity, mapx, mapy, tick);
    }
    drawSquare(x, y, s, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, s, s);
        this.ctx.restore();
    }
    drawRefViewbox(vb, mapx, mapy) {
        let x = vb.x + mapx;
        let y = vb.y + mapy;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#fff";
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + vb.w, y);
        this.ctx.lineTo(x + vb.w, y + vb.h);
        this.ctx.lineTo(x, y + vb.h);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawRefCar(entity, mapx, mapy, tick) {
        let { X, Y } = entity.Collision.currentCp();
        let dotr = 9;
        let { pulser, pulsea } = this.calculateDotPulse(tick, dotr);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(X + mapx, Y + mapy, dotr, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.refColors[entity.id];
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.globalAlpha = pulsea;
        this.ctx.arc(X + mapx, Y + mapy, pulser, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.refColors[entity.id];
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }
    calculateDotPulse(tick, dotr) {
        let pulsea = 1, pulser = 0, maxr = 2 * dotr, dur = 750, int = 1000, progress = (tick * this.step) % int;
        if (progress < dur) {
            let pulseProgress = progress / dur;
            pulsea = 1 - pulseProgress;
            pulser = (maxr - dotr) * pulseProgress + dotr;
        }
        return { pulsea, pulser };
    }
}
RenderViewBox.query = {
    has: ["ViewBox"],
};
export default RenderViewBox;
