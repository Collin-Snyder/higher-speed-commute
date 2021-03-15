import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../main";

export class CaffeineSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["CaffeineBoost"],
  };
  public step: number;

  constructor(private _game: Game, ecs: ECS, step: number) {
    super(ecs);
    this.step = step;
  }
  update(tick: number, entities: Set<Entity>) {
    for (let entity of entities) {
      for (let cb of entity.CaffeineBoost) {
        cb.wearOff -= this.step;
        if (cb.wearOff <= 0) entity.removeComponent(cb);
      }
    }
  }
}
