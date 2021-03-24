import ECS, { Entity, BaseComponent } from "@fritzy/ecs";
import { Game } from "../main";

export class LightTimerSystem extends ECS.System {
  public states: { [state: string]: IState };
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Color", "Timer"],
  };
  public global: BaseComponent;

  constructor(private _game: Game, ecs: any, private step: number) {
    super(ecs);
    this.global = ecs.getEntity("global").Global;
    this.states = {
      green: {
        on: { TIMER: "yellow" },
      },
      yellow: {
        on: { TIMER: "red" },
        interval: 2000,
      },
      red: {
        on: { TIMER: "green" },
        interval: 5000,
      },
    };
  }

  update(tick: number, entities: Set<Entity>): void {
    const lightEntities = [...entities];
    for (let lightEntity of lightEntities) {
      let { Timer } = lightEntity;
      let interval =
        this.states[lightEntity.Color.color].interval ?? Timer.interval;
      Timer.timeSinceLastInterval += this.step;
      if (Timer.timeSinceLastInterval >= interval) {
        this.transition(lightEntity, "TIMER");
      }
    }
  }

  transition(lightEntity: any, action: string): void {
    let { Color, Timer, Renderable } = lightEntity;
    let nextColor = <TLightColor>this.states[Color.color].on[action];
    let sprite = this.ecs
      .getEntity("global")
      .Global.game.spriteMap.getSprite(`${nextColor}Light`);
    Color.color = nextColor;
    Timer.timeSinceLastInterval = 0;
    Renderable.spriteX = sprite.x;
    Renderable.spriteY = sprite.y;
  }
}
