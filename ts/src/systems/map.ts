import EntityComponentSystem, { ECS, Entity } from "@fritzy/ecs";
import {
  findCenteredElementSpread,
  getCenterPoint,
  getTileHitbox,
} from "../modules/gameMath";

export class MapSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Map", "TileMap"],
  };
  private mapOffscreen: HTMLCanvasElement;
  private mapCtx: CanvasRenderingContext2D;

  constructor(ecs: any) {
    super(ecs);
    this.mapOffscreen = <HTMLCanvasElement>(
      document.getElementById("map-offscreen")
    );
    this.mapCtx = <CanvasRenderingContext2D>this.mapOffscreen.getContext("2d");
  }

  update(tick: number, entities: Set<Entity>) {
    let mapEntity = <Entity>entities.values().next().value;
    let newMap = mapEntity.Map.map;

    this.positionMap(mapEntity);
    this.updateDriverEntities(newMap);
    this.createLightEntities(newMap);
    this.createCoffeeEntities(newMap);
    this.drawOffscreenMap(mapEntity);
  }

  positionMap(mapEntity: Entity) {
    mapEntity.Coordinates.X = findCenteredElementSpread(
      window.innerWidth,
      mapEntity.Map.map.pixelWidth,
      1,
      "spaceEvenly"
    ).start;
    mapEntity.Coordinates.Y = findCenteredElementSpread(
      window.innerHeight,
      mapEntity.Map.map.pixelHeight,
      1,
      "spaceEvenly"
    ).start;
  }

  createCoffeeEntities(newMap: any) {
    let coffees = this.ecs.queryEntities({ has: ["Caffeine"] });
    for (let coffee of coffees) {
      coffee.destroy();
    }
    for (let id in newMap.coffees) {
      const square = newMap.get(id);
      const { X, Y } = square ? square.coordinates() : { X: 0, Y: 0 };
      const rw = 12;
      const rh = 12;
      let ent = this.ecs.createEntity({
        id: `coffee${id}`,
        Coordinates: {
          X,
          Y,
        },
        Renderable: {
          spriteX: 250,
          spriteY: 0,
          renderWidth: rw,
          renderHeight: rh,
        },
        Collision: {
          hb: getTileHitbox(X, Y, rw, rh),
          cp: getCenterPoint(X, Y, rw, rh),
        },
        Caffeine: {},
      });
      ent.Collision.currentHb = function() {
        //@ts-ignore
        return this.Collision.hb;
      }.bind(ent);
      ent.Collision.currentCp = function() {
        //@ts-ignore
        return this.Collision.cp;
      }.bind(ent);
    }
  }

  createLightEntities(newMap: any) {
    let lights = this.ecs.queryEntities({ has: ["Timer", "Color"] });

    for (let light of lights) {
      light.destroy();
    }

    for (let id in newMap.lights) {
      const square = newMap.get(id);
      const { X, Y } = square ? square.coordinates() : { X: 0, Y: 0 };
      const rw = 25;
      const rh = 25;

      let ent = this.ecs.createEntity({
        id: `light${id}`,
        Coordinates: {
          X,
          Y,
        },
        Timer: {
          interval: newMap.lights[id],
          timeSinceLastInterval: 0,
        },
        Color: {},
        Renderable: {
          spriteX: 200,
          spriteY: 0,
          renderWidth: rw,
          renderHeight: rh,
        },
        Collision: {
          hb: getTileHitbox(X, Y, rw, rh),
          cp: getCenterPoint(X, Y, rw, rh),
        },
      });
      ent.Collision.currentHb = function() {
        //@ts-ignore
        return this.Collision.hb;
      }.bind(ent);
      ent.Collision.currentCp = function() {
        //@ts-ignore
        return this.Collision.cp;
      }.bind(ent);
    }
  }

  updateDriverEntities(newMap: any) {
    let playerEntity = this.ecs.getEntity("player");
    let bossEntity = this.ecs.getEntity("boss");

    let playerCoords = newMap.get(newMap.playerHome)
      ? newMap.get(newMap.playerHome).coordinates()
      : { X: 0, Y: 0 };

    playerEntity.Coordinates.X = playerCoords.X;
    playerEntity.Coordinates.Y = playerCoords.Y;

    let bossCoords = newMap.get(newMap.bossHome)
      ? newMap.get(newMap.bossHome).coordinates()
      : { X: 0, Y: 0 };

    bossEntity.Coordinates.X = bossCoords.X;
    bossEntity.Coordinates.Y = bossCoords.Y;

    this.findBossPath(bossEntity, newMap);
  }

  findBossPath(bossEntity: Entity, newMap: any) {
    bossEntity.Path.path = newMap.findPath(
      newMap.get(newMap.bossHome).coordinates().X,
      newMap.get(newMap.bossHome).coordinates().Y,
      newMap.get(newMap.office).coordinates().X,
      newMap.get(newMap.office).coordinates().Y
    );
  }

  drawOffscreenMap(mapEntity: any) {
    let newMap = mapEntity.Map.map;
    let tileMap = mapEntity.TileMap;
    let tiles = newMap.generateTileMap();
    let global = this.ecs.getEntity("global").Global;

    let x = 0;
    let y = 0;

    this.mapCtx.fillStyle = "#81c76d";
    this.mapCtx.fillRect(
      0,
      0,
      this.mapOffscreen.width,
      this.mapOffscreen.height
    );

    for (let tile of tiles) {
      if (tile) {
        if (typeof tile === "string") {
          let tileCoords = global.spriteMap[tile];
          this.mapCtx.drawImage(
            global.spriteSheet,
            tileCoords.X,
            tileCoords.Y,
            tileMap.tileWidth,
            tileMap.tileHeight,
            x * tileMap.tileWidth,
            y * tileMap.tileHeight,
            tileMap.tileWidth,
            tileMap.tileHeight
          );
        } else if (Array.isArray(tile)) {
          for (let t of tile) {
            let tileCoords = global.spriteMap[t];
            this.mapCtx.drawImage(
              global.spriteSheet,
              tileCoords.X,
              tileCoords.Y,
              tileMap.tileWidth,
              tileMap.tileHeight,
              x * tileMap.tileWidth,
              y * tileMap.tileHeight,
              tileMap.tileWidth,
              tileMap.tileHeight
            );
          }
        }
      }
      if (++x >= newMap.width) {
        x = 0;
        y++;
      }
    }
  }
}
