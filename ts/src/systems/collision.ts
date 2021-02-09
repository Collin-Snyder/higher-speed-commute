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
  isDiagonal,
  isStopped,
  checkPointCollision,
} from "../modules/gameMath";
const { abs } = Math;

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
    this.map = this.game.ecs.getEntity("map").MapData.map;
    let changes = [...this.changes];
    for (let change of changes) {
      let entity = change.component.entity;
      if (entity.has("Car")) {
        let mapCollision = this.handleMapCollisions(entity);
        let entityCollision = this.handleEntityCollisions(entity);
        if (mapCollision !== "boundary" && entityCollision !== "redLight") {
          let deg = findDegFromVector(entity.Velocity.vector);
          if (deg >= 0) entity.Renderable.degrees = deg;
        }
        entity.Collision.prevHb = entity.Collision.currentHb();
      }
    }
  }

  handleMapCollisions(entity: Entity) {
    let mapCollision = this.detectMapCollision(entity);
    switch (mapCollision) {
      case "boundary":
        if (isDiagonal(entity.Velocity.prevVector)) {
          entity.Velocity.altVectors.push(entity.Velocity.prevVector);
        }
        do {
          this.revert(entity);
          if (!entity.Velocity.altVectors.length) break;

          entity.Velocity.vector = entity.Velocity.altVectors.shift();
          this.move(entity);
          mapCollision = this.detectMapCollision(entity);
        } while (mapCollision === "boundary");
        break;
      case "office":
        if (entity.id === "player") this.game.publish("raceFinished", "won");
        else if (entity.id === "boss")
          this.game.publish("raceFinished", "lost");
        break;
      case "schoolZone":
        if (!entity.SchoolZone) {
          if (entity.id === "boss") {
            let sq = this.map.getSquareByCoords(
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
            let sq = this.map.getSquareByCoords(
              entity.Coordinates.X,
              entity.Coordinates.Y
            ).id;
          }
          entity.removeComponentByType("SchoolZone");
        }
    }
    return mapCollision;
  }

  detectMapCollision(
    entity: Entity
  ): "boundary" | "office" | "schoolZone" | "" {
    let x = entity.Coordinates.X;
    let y = entity.Coordinates.Y;
    let v = entity.Velocity.vector;
    let deg = findDegFromVector(v);
    let hb = entity.Collision.currentHb(deg);
    let diag = isDiagonal(v);

    if (this.checkEdgeCollision(hb)) {
      return "boundary";
    } else {
      let schoolZone = false;
      let surrounding = this.map.getSurroundingSquares(x, y, 2);
      for (let square of surrounding) {
        if (!square) continue;
        let sqCoords = square.coordinates;
        let thb = getTileHitbox(sqCoords.X, sqCoords.Y, 25, 25);
        let coll = checkCollision(hb, thb);
        if (coll) {
          if (!square.drivable) return "boundary";
          if (square.id == this.map.office) return "office";
          if (square.schoolZone) schoolZone = true;
        }
      }
      if (schoolZone) return "schoolZone";
    }
    return "";
  }

  checkValidDiagonalMove(entity: Entity, thb: VectorInterface[]): boolean {
    let cp = entity.Collision.currentCp();
    let w = entity.Renderable.renderWidth;
    let h = entity.Renderable.renderHeight;
    let downLimit = { X: cp.X, Y: cp.Y + w / 2 };
    let upLimit = { X: cp.X, Y: cp.Y - w / 2 };
    let leftLimit = { X: cp.X - w / 2, Y: cp.Y };
    let rightLimit = { X: cp.X + w / 2, Y: cp.Y };
    return true;
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
    if (x1 + w1 >= x2 && x1 <= x2 + w2 && y1 + h1 >= y2 && y2 <= y2 + h2) {
      return true;
    }
    return false;
  }

  handleEntityCollisions(entity: Entity): "car" | "redLight" | "coffee" | "" {
    let collisions = this.detectEntityCollisions(entity);
    let outcome: "car" | "redLight" | "coffee" | "" = "";
    for (let c of collisions) {
      if (c.has("Car") && this.game.mode !== "lost") {
        this.game.publish("raceFinished", "crash");
        outcome = "car";
        break;
      }
      if (c.has("Timer") && c.has("Color") && c.Color.color === "red") {
        //if car is moving AND if car's pre-move location is NOT colliding with the light, then stop car
        if (this.checkForValidLightCollision(entity, c)) {
          this.game.publish("redLight", entity, c);
          this.revert(entity);
          outcome = "redLight";
          break;
        }
      }
      if (c.has("Caffeine")) {
        this.game.publish("caffeinate", entity, c);
        this.collidables = this.collidables.filter((e) => e !== c);
        outcome = "coffee";
      }
    }
    return outcome;
  }

  detectEntityCollisions(entity: Entity) {
    return this.collidables.filter(
      (c: Entity) =>
        entity !== c &&
        checkCollision(entity.Collision.currentHb(), c.Collision.currentHb())
    );
  }

  checkForValidLightCollision(entity: Entity, lightEntity: Entity) {
    let { X, Y } = entity.Velocity.vector;
    if (X === 0 && Y === 0) return false;
    let prevCollision = checkCollision(
      entity.Collision.prevHb,
      lightEntity.Collision.currentHb()
    );
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
    // let deg = findDegFromVector(entity.Velocity.vector);
    // if (deg >= 0) entity.Renderable.degrees = deg;
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
    // let deg = findDegFromVector(entity.Velocity.vector);
    // if (deg >= 0) entity.Renderable.degrees = deg;
    // entity.Velocity.vector.X = 0;
    // entity.Velocity.vector.Y = 0;
  }
}
