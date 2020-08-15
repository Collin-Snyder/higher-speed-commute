//CAR CRASH DETECTION (player, NPCs)
//Broad Phase
//Determine other cars within bounding box of given entity
//Narrow Phase
//Check if new coordinates are in collision with any cars within bounding box
//If yes:
//If player or boss, return new coordinates (some logic for rendering CRASH animation and game over happens)
//If other NPC, return old coordinates (do not set speed to 0, otherwise will need method to check if car in front of it has moved)
//Will need to ensure that NPCs are on paths that do not collide head-on

import ECS, { Entity } from "@fritzy/ecs";
import { calculateSpeedConstant } from "../modules/gameMath";

export class CollisionSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Collision", "Coordinates", "Renderable"],
  };

  static subscriptions: string[] = ["Coordinates"];

  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Array<any>) {
    this.collidables = [...entities];
    this.map = this.ecs.getEntity("global").Global.map.Map.map;
    const mapCollisions = this.detectMapCollisions();
    const entityCollisions = this.detectEntityCollisions();
    this.resolveCollisions(mapCollisions, entityCollisions);
  }

  checkEdgeCollision(x: number, y: number, w: number = 25, h: number = 25) {
    if (
      x < 0 ||
      y < 0 ||
      x + w > this.map.pixelWidth ||
      y + h > this.map.pixelHeight
    ) {
      return true;
    }
    return false;
  }

  checkTileCollision(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w1: number = 25,
    h1: number = 25,
    w2: number = 25,
    h2: number = 25
  ) {
    if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) {
      return true;
    }
    return false;
  }

  checkEntityCollision(entity1: any, entity2: any) {
    //ADD COLLISION CHECKING FOR CIRCULAR LIGHTS
    if (
      entity1.Coordinates.X <
        entity2.Coordinates.X + entity2.Renderable.renderWidth &&
      entity1.Coordinates.X + entity1.Renderable.renderWidth >
        entity2.Coordinates.X &&
      entity1.Coordinates.Y <
        entity2.Coordinates.Y + entity2.Renderable.renderHeight &&
      entity1.Coordinates.Y + entity1.Renderable.renderHeight >
        entity2.Coordinates.Y
    ) {
      return true;
    }
    return false;
  }

  getPreviousCoordinate(
    x: number,
    y: number,
    vx: number,
    vy: number,
    s: number
  ) {
    return {
      X: x - vx * s,
      Y: y - vy * s,
    };
  }

  detectMapCollisions() {
    let mapCollisions = new Map();
    for (let change of this.changes) {
      let entity = change.component.entity;
      let collisions = [];
      let x = entity.Coordinates.X;
      let y = entity.Coordinates.Y;

      if (
        this.checkEdgeCollision(
          x + entity.Collision.fudgeFactor,
          y + entity.Collision.fudgeFactor,
          entity.Renderable.renderWidth - entity.Collision.fudgeFactor * 2,
          entity.Renderable.renderHeight - entity.Collision.fudgeFactor * 2
        )
      ) {
        collisions.push(null);
      } else {
        for (let square of this.map.squares) {
          if (!square) continue;
          let sqCoords = square.coordinates();
          if (
            this.checkTileCollision(
              entity.Coordinates.X + entity.Collision.fudgeFactor,
              entity.Coordinates.Y + entity.Collision.fudgeFactor,
              sqCoords.X,
              sqCoords.Y,
              entity.Renderable.renderWidth - entity.Collision.fudgeFactor * 2,
              entity.Renderable.renderHeight - entity.Collision.fudgeFactor * 2,
              25,
              25
            )
          ) {
            collisions.push(square);
          }
        }
      }
      //@ts-ignore
      mapCollisions.set(entity.id, collisions);
      collisions = [];
    }
    return mapCollisions;
  }

  detectEntityCollisions() {
    //returns array of collision tuples
    const collisions: any[] = [];
    const collisionMap = new Map();
    for (let change of this.changes) {
      let entity1 = change.component.entity;
      if (entity1.Collision.movable) {
        for (let entity2 of this.collidables) {
          if (
            entity1 !== entity2 &&
            this.checkEntityCollision(entity1, entity2) &&
            !collisionMap.has(entity1) &&
            !collisionMap.has(entity2)
          ) {
            collisionMap.set(entity1, entity2);
            collisions.push([entity1, entity2]);
          }
        }
      }
    }
    return collisions;
  }

  resolveCollisions(
    mapCollisions: Map<any, Array<any>>,
    entityCollisions: Array<any>
  ) {
    while (true) {
      for (let [entityID, sq] of mapCollisions) {
        let entity = this.ecs.getEntity(entityID);
        let boundary: boolean = sq.some((s) => !s || !s.drivable);
        let schoolZone: boolean = sq.some((s) => s && s.schoolZone);
        if (boundary) {
          this.stop(entity);
          if (entity.Velocity.altVectors.length) {
            entity.Velocity.vector = entity.Velocity.altVectors.shift();
            this.move(entity);
          }
        } else if (schoolZone) {
          if (!entity.SchoolZone) {
            entity.addComponent("SchoolZone", { multiplier: 0.34 });
          }
        } else {
          if (entity.SchoolZone) {
            entity.removeComponentByType("SchoolZone");
          }
        }
      }
      break;
    }

    for (let ec of entityCollisions) {
      let collider = ec[0];
      let target = ec[1];
      if (
        target.has("Timer") &&
        target.has("Color") &&
        target.Color.color === "red"
      ) {
        this.stop(collider);
      }
    }
  }

  move(entity: Entity) {
    const speedConstant = calculateSpeedConstant(entity);
    entity.Coordinates.X +=
      entity.Velocity.vector.X * speedConstant;
    entity.Coordinates.Y +=
      entity.Velocity.vector.Y * speedConstant;
  }

  stop(entity: Entity) {
    const speedConstant = calculateSpeedConstant(entity);
    let { X, Y } = this.getPreviousCoordinate(
      entity.Coordinates.X,
      entity.Coordinates.Y,
      entity.Velocity.vector.X,
      entity.Velocity.vector.Y,
      speedConstant
    );
    entity.Coordinates.X = X;
    entity.Coordinates.Y = Y;
  }
}
