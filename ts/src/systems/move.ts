import ECS, { Entity } from "@fritzy/ecs";
import {
  calculateSpeedConstant,
  canHasFudge,
  normalize,
  checkVelocityZero,
} from "../modules/gameMath";

export class MovementSystem extends ECS.System {
  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    const playerEntity = this.ecs
      .queryEntities({ has: ["Car", "Velocity"], hasnt: ["Path"] })
      .values()
      .next().value;
    const npcEntities = [
      ...this.ecs.queryEntities({
        has: ["Car", "Velocity", "Coordinates", "Path"],
      }),
    ];

    //Player movement
    const playerSpeedConstant = calculateSpeedConstant(playerEntity);
    const oldVector = playerEntity.Velocity.vector;
    const vectors = playerEntity.Velocity.altVectors;
    if (vectors.length > 1) {
      let firstAlt = vectors[0];
      playerEntity.Velocity.vector = normalize(vectors);
      if (oldVector.X === firstAlt.X && oldVector.Y === firstAlt.Y) {
        vectors[0] = vectors[1];
        vectors[1] = firstAlt;
      }
    } else {
      playerEntity.Velocity.vector = vectors[0];
      playerEntity.Velocity.altVectors.pop();
    }

    playerEntity.Coordinates.X +=
      playerEntity.Velocity.vector.X * playerSpeedConstant;
    playerEntity.Coordinates.Y +=
      playerEntity.Velocity.vector.Y * playerSpeedConstant;

    //NPC movement
    for (let entity of npcEntities) {
      const path = entity.Path.path;
      let { X, Y } = entity.Coordinates;
      let [X2, Y2] = path[path.length - 1];
      if (
        (canHasFudge(X, Y, X2, Y2, entity.Collision.fudgeFactor) ||
          checkVelocityZero(entity.Velocity.vector)) &&
        path.length > 1
      ) {
        let [newX, newY] = path[path.length - 2];
        let Xdiff = newX - X;
        let Ydiff = newY - Y;
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
    }
  }
}

