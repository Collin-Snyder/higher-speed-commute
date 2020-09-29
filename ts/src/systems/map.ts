import EntityComponentSystem, { ECS, Entity } from "@fritzy/ecs";
import { findCenteredElementSpread } from "../modules/gameMath";

export class MapSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Map", "TileMap"],
  };
  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    let mapEntity = entities.values().next().value;
    let newMap = mapEntity.Map.map;
    let globalEntity = this.ecs.getEntity("global");
    let playerEntity = this.ecs.getEntity("player");
    let bossEntity = this.ecs.getEntity("boss");
    let lights = this.ecs.queryEntities({ has: ["Timer", "Color"] });
    let coffees = this.ecs.queryEntities({ has: ["Caffeine"] });

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

    // mapEntity.TileMap.tiles = newMap.generateTileMap();

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

    for (let light of lights) {
      light.destroy();
    }
    for (let coffee of coffees) {
      coffee.destroy();
    }

    globalEntity.Global.game.lightEntities = {};
    globalEntity.Global.game.coffeeEntities = {};

    bossEntity.Path.path = newMap.findPath(
      newMap.get(newMap.bossHome).coordinates().X,
      newMap.get(newMap.bossHome).coordinates().Y,
      newMap.get(newMap.office).coordinates().X,
      newMap.get(newMap.office).coordinates().Y
    );

    for (let id in newMap.lights) {
      const square = newMap.get(id);

      globalEntity.Global.game.lightEntities[id] = this.ecs.createEntity({
        id: `light${id}`,
        Coordinates: {
          ...(square ? square.coordinates() : { X: 0, Y: 0 }),
        },
        Timer: {
          interval: newMap.lights[id],
          timeSinceLastInterval: 0,
        },
        Color: {},
        Renderable: {
          spriteX: 200,
          spriteY: 0,
        },
        Collision: {},
      });
    }

    for (let id in newMap.coffees) {
      const square = newMap.get(id);
      globalEntity.Global.game.coffeeEntities[id] = this.ecs.createEntity({
        id: `coffee${id}`,
        Coordinates: {
          ...(square ? square.coordinates() : { X: 0, Y: 0 }),
        },
        Renderable: {
          spriteX: 250,
          spriteY: 0,
        },
        Collision: {},
        Caffeine: {},
      });
    }
    
  }
}
