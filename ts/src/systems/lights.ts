import ECS, { Entity, BaseComponent } from "@fritzy/ecs";

interface StateInterface {
  on: { [action: string]: string };
  [prop: string]: any;
}

type Color = "green" | "yellow" | "red";

export class LightTimer extends ECS.System {
  public states: { [state: string]: StateInterface };
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Color", "Timer"],
  };
  public global: BaseComponent;

  constructor(ecs: any, private step: number) {
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
    let {Color, Timer, Renderable} = lightEntity;
    let nextColor = <Color>this.states[Color.color].on[action];
    let sprite = this.ecs.getEntity("global").Global.game.spriteMap[
      `${nextColor}Light`
    ];
    Color.color = nextColor;
    Timer.timeSinceLastInterval = 0;
    Renderable.spriteX = sprite.x;
    Renderable.spriteY = sprite.y;
  }
}
