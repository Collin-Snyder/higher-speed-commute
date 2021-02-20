import ECS, { Entity } from "@fritzy/ecs";
import Game from "../main";
import {
  calculateSpeedConstant,
  findRotatedVertex,
  findDegFromVector,
  checkCollision,
  getTileHitbox,
  isDiagonal,
  checkPointCollision,
} from "gameMath";

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
    this.map = this.game.ecs.getEntity("map").MapData.map;
    let driverEntities = [
      this.game.ecs.getEntity("player"),
      this.game.ecs.getEntity("boss"),
    ];
    for (let driverEntity of driverEntities) {
      if (driverEntity.id === "player" && driverEntity.Velocity.vector.X > 0) {
        console.log("hi");
      }
      let mapCollision = this.handleMapCollisions(driverEntity);
      // if (mapCollision === "office") return;
      let entityCollision = this.handleEntityCollisions(driverEntity);
      // if (entityCollision === "car") return;
      if (mapCollision !== "boundary" && entityCollision !== "redLight") {
        let deg = findDegFromVector(driverEntity.Velocity.vector);
        if (deg >= 0) driverEntity.Renderable.degrees = deg;
      }
      driverEntity.Collision.prevHb = driverEntity.Collision.currentHb();
      // if (mapCollision === "office" || entityCollision === "car") return;
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
          entity.addComponent("SchoolZone", { multiplier: 0.34 });
        }
        break;
      default:
        if (entity.SchoolZone) {
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

    if (this.checkEdgeCollision(hb)) {
      return "boundary";
    } else {
      let schoolZone = false;
      let surrounding = this.map.getSurroundingSquares(x, y, 2);
      for (let square of surrounding) {
        if (!square) continue;
        let sqCoords = square.coordinates;
        let thb = getTileHitbox(sqCoords.X, sqCoords.Y, 25, 25);
        if (!square.drivable) {
          //check only front vertices for collision
          if (this.checkFrontOnlyCollision(hb, thb)) return "boundary";
        } else if (checkCollision(hb, thb)) {
          if (square.id == this.map.office) return "office";
          if (square.schoolZone) schoolZone = true;
        }
      }
      if (schoolZone) return "schoolZone";
    }
    return "";
  }

  checkValidDiagonalMove(entity: Entity, thb: IVector[]): boolean {
    let cp = entity.Collision.currentCp();
    let w = entity.Renderable.renderW;
    let h = entity.Renderable.renderH;
    let downLimit = { X: cp.X, Y: cp.Y + w / 2 };
    let upLimit = { X: cp.X, Y: cp.Y - w / 2 };
    let leftLimit = { X: cp.X - w / 2, Y: cp.Y };
    let rightLimit = { X: cp.X + w / 2, Y: cp.Y };
    return true;
  }

  checkEdgeCollision(hb: IVector[]) {
    let mw = this.map.pixelWidth;
    let mh = this.map.pixelHeight;
    for (let { X, Y } of hb) {
      if (X < 0 || Y < 0 || X > mw || Y > mh) return true;
    }
    return false;
  }

  checkFrontOnlyCollision(hb: IVector[], thb: IVector[]) {
    let frontL = hb[0];
    let frontR = hb[1];

    let flhit = checkPointCollision(thb, frontL.X, frontL.Y);
    if (flhit) return true;
    let frhit = checkPointCollision(thb, frontR.X, frontR.Y);
    if (frhit) return true;

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
    let v = entity.Velocity.vector;
    let deg = findDegFromVector(v);
    let hb = entity.Collision.currentHb(deg);
    return this.collidables.filter(
      (c: Entity) => entity !== c && checkCollision(hb, c.Collision.currentHb())
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

    hb = hb.map((v: IVector) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
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
