import ECS, { Entity } from "@fritzy/ecs";
import {
  calculateSpeedConstant,
  canHasFudge,
  normalize,
  checkVelocityZero,
  findDegFromVector,
  VectorInterface,
  checkPointCollision,
  getTileHitbox,
} from "../modules/gameMath";

export class MovementSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity", "Coordinates"],
  };

  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    let game = this.ecs.getEntity("global").Global.game;
    let { mode, focusView, mapView } = game;
    if (mode !== "playing") return;

    for (let entity of entities) {
      if (entity.has("Path")) this.handleNPCMovement(entity);
      else if (focusView === "player" && !mapView)
        this.handlePlayerMovement(entity);
    }
  }

  handlePlayerMovement(entity: Entity): void {
    const playerSpeedConstant = calculateSpeedConstant(entity);
    entity.Velocity.prevVector = entity.Velocity.vector;
    entity.Velocity.vector = entity.Velocity.altVectors.shift();
    entity.Coordinates.X += entity.Velocity.vector.X * playerSpeedConstant;
    entity.Coordinates.Y += entity.Velocity.vector.Y * playerSpeedConstant;
    // let deg = findDegFromVector(entity.Velocity.vector);
    // if (deg >= 0) entity.Renderable.degrees = deg;
  }

  handleNPCMovement(entity: Entity): void {
    const path = entity.Path.path;
    let { X, Y } = entity.Coordinates;
    let [X2, Y2] = path[path.length - 1];
    if (
      this.carInSquare(
        entity.Collision.currentHb(),
        getTileHitbox(X2, Y2, 25, 25)
      ) &&
      path.length > 1
    ) {
      let [newX, newY] = path[path.length - 2];
      let Xdiff = newX - X;
      let Ydiff = newY - Y;
      // entity.Velocity.prevVector = entity.Velocity.vector;
      if (Math.abs(Xdiff) > Math.abs(Ydiff)) {
        entity.Velocity.vector = { X: Math.sign(Xdiff), Y: 0 };
      } else {
        entity.Velocity.vector = { X: 0, Y: Math.sign(Ydiff) };
      }
      path.pop();
    }
    let entitySpeedConstant = calculateSpeedConstant(entity);
    entity.Coordinates.X += entity.Velocity.vector.X * entitySpeedConstant;
    entity.Coordinates.Y += entity.Velocity.vector.Y * entitySpeedConstant;
    let deg = findDegFromVector(entity.Velocity.vector);
    if (deg >= 0) entity.Renderable.degrees = deg;
  }

  carInSquare(chb: VectorInterface[], shb: VectorInterface[]) {
    for (let { X, Y } of chb) {
      if (!checkPointCollision(shb, X, Y)) return false;
    }
    return true;
  }
}
