import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import keyCodes from "../keyCodes";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  public global: BaseComponent;
  public spaceBarTime: number;
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.global = this.ecs.getEntity("global")["Global"];
    this.keyPressMap = this.global.inputs.keyPressMap;
    this.spaceBarTime = 20;
  }

  update(tick: number, entities: Set<Entity>) {
    let newTime = this.spaceBarTime - tick;
    if (newTime <= 0) {
      if (this.keyPressMap[keyCodes.SPACE]) {
        this.global.paused = !this.global.paused;
        this.spaceBarTime = tick + 20;
      }
    }
    if (!this.global.paused) {
      const playerEntity = entities.values().next().value;
      playerEntity.Velocity.altVectors = this.getPotentialVectors();
    }
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
}
