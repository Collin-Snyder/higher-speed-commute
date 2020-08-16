import ECS, { Entity } from "@fritzy/ecs";
import keyCodes from "../keyCodes";

export class InputSystem extends ECS.System {
  public keyPressMap: { [key: string]: boolean };
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
  };

  constructor(ecs: any) {
    super(ecs);
    this.keyPressMap = this.ecs.getEntity("global")[
      "Global"
    ].inputs.keyPressMap;
  }

  update(tick: number, entities: Set<Entity>) {
    const playerEntity = entities.values().next().value;
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

}
