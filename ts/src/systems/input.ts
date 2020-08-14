import ECS from "@fritzy/ecs";
import keyCodes from "../keyCodes";

export class InputSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    // this.global.inputs = this.ecs.getEntity("global").Global.inputs;
    this.global = this.ecs.getEntity("global").Global;
  }

  update(tick: number, entities: Array<any>) {
      entities = [...entities];
      const playerEntity = entities[0];
    // if (this.global.inputs.keyPressMap[keyCodes.SPACE]) {
    //     this.global.game.paused = !this.global.game.paused;
    // }
    if (!this.global.game.paused) {
      if (
        this.global.inputs.keyPressMap[keyCodes.LEFT] &&
        playerEntity.Velocity.vector.X >= 0
      ) {
        playerEntity.Velocity.vector.X = -1;
        playerEntity.Velocity.vector.Y = 0;
      } else if (
        this.global.inputs.keyPressMap[keyCodes.RIGHT] &&
        playerEntity.Velocity.vector.X <= 0
      ) {
        playerEntity.Velocity.vector.X = 1;
        playerEntity.Velocity.vector.Y = 0;
      } else if (
        this.global.inputs.keyPressMap[keyCodes.UP] &&
        playerEntity.Velocity.vector.Y >= 0
      ) {
        playerEntity.Velocity.vector.X = 0;
        playerEntity.Velocity.vector.Y = -1;
      } else if (
        this.global.inputs.keyPressMap[keyCodes.DOWN] &&
        playerEntity.Velocity.vector.Y <= 0
      ) {
        playerEntity.Velocity.vector.X = 0;
        playerEntity.Velocity.vector.Y = 1;
      } else {
        playerEntity.Velocity.vector.X = 0;
        playerEntity.Velocity.vector.Y = 0;
      }
    } else {
      for (let entity of entities) {
        entity.Velocity.vector.X = 0;
        entity.Velocity.vector.Y = 0;
      }
    }
    //   playerEntity.Coordinates.X +=
    //     playerEntity.Velocity.vector.X *
    //     playerEntity.Velocity.speedConstant;
    //   playerEntity.Coordinates.Y +=
    //     playerEntity.Velocity.vector.Y *
    //     playerEntity.Velocity.speedConstant;
  }

  //if arrow keys pressed, update player speed/vector
  //if space key pressed, update all entities speed (0 or game speed constant)
}
