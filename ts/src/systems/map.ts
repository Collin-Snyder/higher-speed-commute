import EntityComponentSystem, { ECS, Entity } from "@fritzy/ecs";
import {
  findCenteredElementSpread,
  getCenterPoint,
  getTileHitbox,
} from "../modules/gameMath";
import { small, regular } from "../modules/breakpoints";
import { drawTileMap } from "../modules/tileDrawer";
import { Tile } from "../state/map";

export class MapSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["MapData", "TileData"],
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
    let {
      MapData: { map },
      TileData,
    } = mapEntity;
    TileData.tiles = map.generateTileMap();

    this.positionMap(mapEntity);
    this.updateDriverEntities(map);
    this.createLightEntities(map);
    this.createCoffeeEntities(map);
    this.drawOffscreenMap(mapEntity);
  }

  positionMap(mapEntity: Entity) {
    let {
      Coordinates,
      MapData: {
        map: { pixelWidth, pixelHeight },
      },
    } = mapEntity;

    Coordinates.X = findCenteredElementSpread(
      window.innerWidth,
      pixelWidth,
      1,
      "spaceEvenly"
    ).start;
    Coordinates.Y = findCenteredElementSpread(
      window.innerHeight,
      pixelHeight,
      1,
      "spaceEvenly"
    ).start;
  }

  updateDriverEntities(newMap: any) {
    let game = window.game;
    let playerEntity = this.ecs.getEntity("player");
    let bossEntity = this.ecs.getEntity("boss");

    let playerCoords = newMap.getSquare(newMap.playerHome)
      ? newMap.getSquare(newMap.playerHome).coordinates
      : { X: 0, Y: 0 };

    playerEntity.Coordinates.X = playerCoords.X;
    playerEntity.Coordinates.Y = playerCoords.Y;

    let bossCoords = newMap.getSquare(newMap.bossHome)
      ? newMap.getSquare(newMap.bossHome).coordinates
      : { X: 0, Y: 0 };

    bossEntity.Coordinates.X = bossCoords.X;
    bossEntity.Coordinates.Y = bossCoords.Y;

    this.findDriverPath(bossEntity, newMap);
    if (game.autopilot) this.findDriverPath(playerEntity, newMap);
  }

  createLightEntities(newMap: any) {
    let lights = this.ecs.queryEntities({ has: ["Timer", "Color"] });
    let spriteMap = this.ecs.getEntity("global").Global.spriteMap;

    for (let light of lights) {
      light.destroy();
    }

    for (let id in newMap.lights) {
      const square = newMap.getSquare(id);
      const { X, Y } = square ? square.coordinates : { X: 0, Y: 0 };
      const rw = 25;
      const rh = 25;

      let ent = this.ecs.createEntity({
        id: `light${id}`,
        tags: ["tileSized"],
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
          spriteX: spriteMap.greenLight.X,
          spriteY: spriteMap.greenLight.Y,
          renderWidth: rw,
          renderHeight: rh,
          visible: false,
        },
        Collision: {
          hb: getTileHitbox(X, Y, rw, rh),
          cp: getCenterPoint(X, Y, rw, rh),
        },
        // Breakpoint: [
        //   { name: "small", width: small.tileSize, height: small.tileSize },
        //   {
        //     name: "regular",
        //     width: regular.tileSize,
        //     height: regular.tileSize,
        //   },
        // ],
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

  createCoffeeEntities(newMap: any) {
    let coffees = this.ecs.queryEntities({ has: ["Caffeine"] });
    for (let coffee of coffees) {
      coffee.destroy();
    }
    for (let id in newMap.coffees) {
      const square = newMap.getSquare(id);
      const { X, Y } = square ? square.coordinates : { X: 0, Y: 0 };
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
          visible: false,
        },
        Collision: {
          hb: getTileHitbox(X, Y, rw, rh),
          cp: getCenterPoint(X, Y, rw, rh),
        },
        Caffeine: {},
        // Breakpoint: [
        //   {
        //     name: "small",
        //     width: Math.ceil(small.tileSize / 20),
        //     height: Math.ceil(small.tileSize / 20),
        //   },
        //   {
        //     name: "regular",
        //     width: Math.ceil(regular.tileSize / 2),
        //     height: Math.ceil(regular.tileSize / 2),
        //   },
        // ],
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

  findDriverPath(driverEntity: Entity, newMap: any) {
    let homeCoords = newMap.getKeySquare(`${driverEntity.id}Home`).coordinates;
    let officeCoords = newMap.getKeySquare("office").coordinates;
    driverEntity.Path.path = newMap.findPath(
      homeCoords.X,
      homeCoords.Y,
      officeCoords.X,
      officeCoords.Y
    );
  }

  drawOffscreenMap(mapEntity: any) {
    this.mapCtx.fillStyle = "#81c76d";
    this.mapCtx.fillRect(
      0,
      0,
      this.mapOffscreen.width,
      this.mapOffscreen.height
    );

    // drawTileMap(
    //   tileMap.tiles,
    //   newMap.width,
    //   (
    //     type: Tile,
    //     x: number,
    //     y: number,
    //     w: number,
    //     h: number,
    //     a: number,
    //     deg: number
    //   ) => {
    //     let tileCoords = global.spriteMap[type];
    //     this.mapCtx.drawImage(
    //       global.spriteSheet,
    //       tileCoords.X,
    //       tileCoords.Y,
    //       tileMap.tileWidth,
    //       tileMap.tileHeight,
    //       x * tileMap.tileWidth,
    //       y * tileMap.tileHeight,
    //       tileMap.tileWidth,
    //       tileMap.tileHeight
    //     );
    //   }
    // );
  }
}
