import ECS, { Entity } from "@fritzy/ecs";
import {
  calculateSpeedConstant,
  findDegFromVector,
  checkPointCollision,
  getTileHitbox,
} from "gameMath";
import { Game } from "../main";
const { abs, sign } = Math;

export class MovementSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity", "Coordinates"],
  };

  constructor(private _game: Game, ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    let { mode, focusView, mapView } = this._game;
    if (mode !== "playing") return;

    for (let entity of entities) {
      if (entity.has("Path")) this.handleNPCMovement(entity);
      else if (!entity.has("Path") && focusView === "player" && !mapView)
        this.handlePlayerMovement(entity);
    }
  }

  handlePlayerMovement(entity: Entity): void {
    const playerSpeedConstant = calculateSpeedConstant(entity);
    entity.Velocity.prevVector = entity.Velocity.vector;
    entity.Velocity.vector = entity.Velocity.altVectors.shift();
    entity.Coordinates.X += entity.Velocity.vector.X * playerSpeedConstant;
    entity.Coordinates.Y += entity.Velocity.vector.Y * playerSpeedConstant;
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
      if (abs(Xdiff) > abs(Ydiff)) {
        entity.Velocity.vector = { X: sign(Xdiff), Y: 0 };
      } else {
        entity.Velocity.vector = { X: 0, Y: sign(Ydiff) };
      }
      path.pop();
    }
    let entitySpeedConstant = calculateSpeedConstant(entity);
    entity.Coordinates.X += entity.Velocity.vector.X * entitySpeedConstant;
    entity.Coordinates.Y += entity.Velocity.vector.Y * entitySpeedConstant;
    let deg = findDegFromVector(entity.Velocity.vector);
    if (deg >= 0) entity.Renderable.degrees = deg;
  }

  carInSquare(chb: IVector[], shb: IVector[]) {
    for (let { X, Y } of chb) {
      if (!checkPointCollision(shb, X, Y)) return false;
    }
    return true;
  }
}
