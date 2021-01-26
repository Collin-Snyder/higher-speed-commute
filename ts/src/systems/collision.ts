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
import { isExpressionWithTypeArguments } from "../../../node_modules/typescript/lib/typescript";
import Game from "../main";
import {
  calculateSpeedConstant,
  findRotatedVertex,
  findDegFromVector,
  checkCollision,
  VectorInterface,
  getTileHitbox,
} from "../modules/gameMath";

export class CollisionSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Collision", "Coordinates", "Renderable"],
  };
  public collidables: Entity[];
  public map: any;
  public game: Game;
  public globalEntity: Entity;

  static subscriptions: string[] = ["Coordinates"];

  constructor(ecs: any) {
    super(ecs);
    this.collidables = [];
    this.globalEntity = this.ecs.getEntity("global");
    this.game = this.globalEntity.Global.game;
  }

  update(tick: number, entities: Set<Entity>) {
    this.collidables = [...entities];
    // this.game = this.globalEntity.Global.game;
    this.map = this.globalEntity.Global.map.Map.map;
    let changes = [...this.changes];
    for (let change of changes) {
      let entity = change.component.entity;
      if (entity.has("Car")) {
        this.handleMapCollisions(entity);
        this.handleEntityCollisions(entity);
      }
    }
  }

  handleMapCollisions(entity: Entity) {
    let mapCollision = this.detectMapCollision(entity);
    switch (mapCollision) {
      case "boundary":
        do {
          this.revert(entity);
          if (!entity.Velocity.altVectors.length) break;
          // entity.Velocity.prevVector = entity.Velocity.vector;
          entity.Velocity.vector = entity.Velocity.altVectors.shift();
          this.move(entity);
          mapCollision = this.detectMapCollision(entity);
        } while (mapCollision === "boundary");
        break;
      case "office":
        if (entity.id === "player") this.game.publish("win");
        else if (entity.id === "boss") this.game.publish("lose");
        break;
      case "schoolZone":
        if (!entity.SchoolZone) {
          if (entity.id === "boss") {
            let sq = this.game.ecs
              .getEntity("map")
              .Map.map.getSquareByCoords(
                entity.Coordinates.X,
                entity.Coordinates.Y
              ).id;
          }
          entity.addComponent("SchoolZone", { multiplier: 0.34 });
        }
        break;
      default:
        if (entity.SchoolZone) {
          if (entity.id === "boss") {
            let sq = this.game.ecs
              .getEntity("map")
              .Map.map.getSquareByCoords(
                entity.Coordinates.X,
                entity.Coordinates.Y
              ).id;
          }
          entity.removeComponentByType("SchoolZone");
        }
    }
  }

  detectMapCollision(
    entity: Entity
  ): "boundary" | "office" | "schoolZone" | "" {
    let x = entity.Coordinates.X;
    let y = entity.Coordinates.Y;
    let hb = entity.Collision.currentHb();

    if (this.checkEdgeCollision(hb)) {
      return "boundary";
    } else {
      let schoolZone = false;
      let surrounding = this.map.getSurroundingSquares(x, y, 2);
      for (let square of surrounding) {
        if (!square) continue;
        let sqCoords = square.coordinates;
        let thb = getTileHitbox(sqCoords.X, sqCoords.Y, 25, 25);
        let col = checkCollision(hb, thb);
        if (col) {
          if (!square.drivable) return "boundary";
          if (square.id == this.map.office) return "office";
          if (square.schoolZone) schoolZone = true;
        }
      }
      if (schoolZone) return "schoolZone";
    }
    return "";
  }

  checkEdgeCollision(hb: VectorInterface[]) {
    let mw = this.map.pixelWidth;
    let mh = this.map.pixelHeight;
    for (let { X, Y } of hb) {
      if (X < 0 || Y < 0 || X > mw || Y > mh) return true;
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

  handleEntityCollisions(entity: Entity) {
    let collisions = this.detectEntityCollisions(entity);
    for (let c of collisions) {
      if (c.has("Car") && this.game.mode !== "lost") {
        this.game.publish("crash");
      }
      if (c.has("Timer") && c.has("Color") && c.Color.color === "red") {
        //if car is moving AND if car's pre-move location is NOT colliding with the light, then stop car
        if (this.checkForValidLightCollision(entity, c)) {
          this.game.publish("redLight", entity, c);
          this.revert(entity);
        }
      }
      if (c.has("Caffeine")) {
        this.game.publish("caffeinate", entity, c);
        // c.removeComponentByType("Renderable");
        this.collidables = this.collidables.filter((e) => e !== c);
        // entity.addComponent("CaffeineBoost", c.Caffeine);
      }
    }
  }

  detectEntityCollisions(entity: Entity) {
    // return this.collidables.filter(
    //   (c: Entity) => entity !== c && this.checkEntityCollision(entity, c)
    // );
    return this.collidables.filter(
      (c: Entity) =>
        entity !== c &&
        checkCollision(entity.Collision.currentHb(), c.Collision.currentHb())
    );
  }

  checkEntityCollision(entity1: any, entity2: any) {
    let fudge1 = entity1.Collision.fudgeFactor;
    let fudge2 = entity2.Collision.fudgeFactor;
    let x1 = entity1.Coordinates.X + fudge1;
    let y1 = entity1.Coordinates.Y + fudge1;
    let x2 = entity2.Coordinates.X + fudge2;
    let y2 = entity2.Coordinates.Y + fudge2;
    let w1 = entity1.Renderable.renderWidth - fudge1 * 2;
    let h1 = entity1.Renderable.renderHeight - fudge1 * 2;
    let w2 = entity2.Renderable.renderWidth - fudge2 * 2;
    let h2 = entity2.Renderable.renderHeight - fudge2 * 2;
    return this.checkTileCollision(x1, y1, x2, y2, w1, h1, w2, h2);
  }

  checkForValidLightCollision(entity: Entity, lightEntity: Entity) {
    let { X, Y } = entity.Velocity.vector;
    if (X === 0 && Y === 0) return false;
    const speedConstant = calculateSpeedConstant(entity);
    let prevEnt = {
      ...entity,
      Coordinates: this.getPreviousCoordinate(
        entity.Coordinates.X,
        entity.Coordinates.Y,
        entity.Velocity.vector.X,
        entity.Velocity.vector.Y,
        speedConstant
      ),
    };
    let prevCollision = this.checkEntityCollision(prevEnt, lightEntity);
    return !prevCollision;
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

  updateHitbox(entity: Entity) {
    // let { degrees } = entity.Renderable;
    // let degrees = findDegFromVector(entity.Velocity.vector);
    let { hb, cp } = entity.Collision;
    let c = entity.Coordinates;

    hb = hb.map((v: VectorInterface) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
    let cpx = cp.X + c.X;
    let cpy = cp.Y + c.Y;

    let deg = entity.Renderable.degrees;
    if (deg === 0) return hb;
    // entity.Renderable.degrees = degrees;
    //@ts-ignore
    return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
    //figure out if cp is already at origin, thereby not needing translation
  }

  move(entity: Entity) {
    const speedConstant = calculateSpeedConstant(entity);
    entity.Coordinates.X += entity.Velocity.vector.X * speedConstant;
    entity.Coordinates.Y += entity.Velocity.vector.Y * speedConstant;
    let deg = findDegFromVector(entity.Velocity.vector);
    if (deg >= 0) entity.Renderable.degrees = deg;
  }

  revert(entity: Entity) {
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
    if (entity.Velocity.prevVector)
      entity.Velocity.vector = entity.Velocity.prevVector;
    // entity.Velocity.prevVector = null;
    let deg = findDegFromVector(entity.Velocity.vector);
    if (deg >= 0) entity.Renderable.degrees = deg;
    // entity.Velocity.vector.X = 0;
    // entity.Velocity.vector.Y = 0;
  }
}
