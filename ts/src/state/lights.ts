export interface LightStateInterface {
  id: number;
  interval: number;
  color: Color;
  timeSinceLastUpdate: number;
}

interface StateInterface {
  on: { [action: string]: string };
  [prop: string]: any;
}

export interface LightTimerMachineInterface {
  states: { [state: string]: StateInterface };
  lights: { [id: string]: LightStateInterface };
  transition: Function;
  refreshLights: Function;
}

type Color = "green" | "yellow" | "red";

class LightTimerMachine {
  public states: { [state: string]: StateInterface };
  public lights: { [id: string]: LightStateInterface };

  constructor(intervalMap: { [id: string]: number }) {
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

    this.lights = {};

    for (let id in intervalMap) {
      let interval = intervalMap[id];
      this.lights[id] = {
        id: Number(id),
        interval,
        color: "green",
        timeSinceLastUpdate: 0,
      };
    }
  }

  transition(id: number, action: string): LightStateInterface {
    let nextState = <Color>this.states[this.lights[id].color].on[action];
    this.lights[id].color = nextState;
    this.lights[id].timeSinceLastUpdate = 0;
    return this.lights[id];
  }

  refreshLights(step: number): LightStateInterface[] {
    const updates = [];
    for (let id in this.lights) {
      let light = this.lights[id];
      let interval: number =
        this.states[this.lights[id].color].interval ?? light.interval;
      light.timeSinceLastUpdate += step;
      if (light.timeSinceLastUpdate >= interval)
        updates.push(this.transition(Number(id), "TIMER"));
    }
    return updates;
  }
}

export default LightTimerMachine;
