import ECS from "@fritzy/ecs";

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

  constructor(
    ecs: any,
    private step: number
  ) {
    super(ecs);
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

  update(tick: number, entities: Array<any>): void {
    const lightEntities = [...entities];
    for (let lightEntity of lightEntities) {
      let interval: number =
        this.states[lightEntity.Color.color].interval ??
        lightEntity.Timer.interval;
      lightEntity.Timer.timeSinceLastInterval += this.step;
      if (lightEntity.Timer.timeSinceLastInterval >= interval) {
        this.transition(lightEntity, "TIMER");
      }
    }
  }

  transition(lightEntity: any, action: string): void {
    let nextColor = <Color>this.states[lightEntity.Color.color].on[action];
    lightEntity.Color.color = nextColor;
    lightEntity.Timer.timeSinceLastInterval = 0;
  }
}

