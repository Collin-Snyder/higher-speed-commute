import ECS, { BaseComponent, Entity } from "@fritzy/ecs";
import keyCodes from "../keyCodes";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: booleans };
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.keyPressMap = this.ecs.getEntity("global")[
      "Global"
    ].inputs.keyPressMap;
  }

  update(tick: number, entities: Array<any>) {
    entities = [...entities];
    const playerEntity = entities[0];

    // if (!this.global.game.paused) {
    // if (
    //   this.keyPressMap[keyCodes.LEFT] &&
    //   playerEntity.Velocity.vector.X >= 0
    // ) {
    //   playerEntity.Velocity.vector.X = -1;
    //   playerEntity.Velocity.vector.Y = 0;
    // } else if (
    //   this.keyPressMap[keyCodes.RIGHT] &&
    //   playerEntity.Velocity.vector.X <= 0
    // ) {
    //   playerEntity.Velocity.vector.X = 1;
    //   playerEntity.Velocity.vector.Y = 0;
    // } else if (
    //   this.keyPressMap[keyCodes.UP] &&
    //   playerEntity.Velocity.vector.Y >= 0
    // ) {
    //   playerEntity.Velocity.vector.X = 0;
    //   playerEntity.Velocity.vector.Y = -1;
    // } else if (
    //   this.keyPressMap[keyCodes.DOWN] &&
    //   playerEntity.Velocity.vector.Y <= 0
    // ) {
    //   playerEntity.Velocity.vector.X = 0;
    //   playerEntity.Velocity.vector.Y = 1;
    // } else if (
    //   !this.keyPressMap[keyCodes.DOWN] &&
    //   !this.keyPressMap[keyCodes.UP] &&
    //   !this.keyPressMap[keyCodes.RIGHT] &&
    //   !this.keyPressMap[keyCodes.LEFT]
    // ) {
    //   playerEntity.Velocity.vector.X = 0;
    //   playerEntity.Velocity.vector.Y = 0;
    // }
    // } else {
    //   for (let entity of entities) {
    //     entity.Velocity.vector.X = 0;
    //     entity.Velocity.vector.Y = 0;
    //   }
    // }

    playerEntity.Velocity.altVectors = this.getPotentialVectors();
  }

  getPotentialVectors() {
    let potentials = [];
    if (this.keyPressMap[keyCodes.LEFT] && !this.keyPressMap[keyCodes.RIGHT])
      potentials.push({ X: -1, Y: 0 });
    if (this.keyPressMap[keyCodes.RIGHT] && !this.keyPressMap[keyCodes.LEFT])
      potentials.push({ X: 1, Y: 0 });
    if (this.keyPressMap[keyCodes.UP] && !this.keyPressMap[keyCodes.DOWN])
      potentials.push({ X: 0, Y: -1 });
    if (this.keyPressMap[keyCodes.DOWN] && !this.keyPressMap[keyCodes.UP])
      potentials.push({ X: 0, Y: 1 });
    if (!potentials.length) potentials.push({ X: 0, Y: 0 });
    return potentials;
  }

  //if arrow keys pressed, update player speed/vector
  //if space key pressed, update all entities speed (0 or game speed constant)
}
