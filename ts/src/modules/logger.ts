import Game from "../main";
type Unit = "ms" | "ticks";
class LogTimer {
  public ready: boolean;
  public msRemaining: number;
  public ticksRemaining: number;

  constructor(
    // public game: Game,
    public unitsPerStep: number,
    public unit: Unit
  ) {
    // this.game = game;
    this.ready = false;
    this.unit = unit;
    this.unitsPerStep = unitsPerStep;
    if (this.unit === "ms") {
      this.ticksRemaining = 0;
      this.msRemaining = unitsPerStep;
    } else {
      this.msRemaining = 0;
      this.ticksRemaining = unitsPerStep;
    }
  }

  log(...thingsToLog: any[]) {
    console.log(...thingsToLog);
    this.ready = false;
  }

  update(et: number) {
    if (this.unit === "ms") this.msRemaining -= et;
    else this.ticksRemaining--;

    //@ts-ignore
    if (this[`${this.unit}Remaining`] <= 0) {
      this.ready = true;
      //@ts-ignore
      this[`${this.unit}Remaining`] = this.unitsPerStep;
    }
  }
}

class LogTimers {
  public timers: { [name: string]: LogTimer };
  private game: Game;
  constructor(game: Game) {
    this.timers = {};
    this.game = game;
  }

  addTimer(name: string, unit: Unit, unitsPerStep: number) {
    if (this.timers.hasOwnProperty(name)) return false;
    console.log("adding timer: ", name);
    this.timers[name] = new LogTimer(unitsPerStep, unit);
  }

  update() {
    let et = this.game.frameElapsedTime;
    for (let name in this.timers) {
      let t = this.timers[name];
      t.update(et);
    }
  }

  removeTimer(name: string) {
    if (this.timers.hasOwnProperty(name)) {
      delete this.timers[name];
      return true;
    }
    return false;
  }

  ready(name: string) {
    return this.timers[name]?.ready;
  }

  log(name: string, ...thingsToLog: any[]) {
    if (this.timers[name] && this.timers[name].ready) {
      this.timers[name].log(...thingsToLog);
    }
  }

  has(name: string) {
      if (this.timers.hasOwnProperty(name)) return true;
      return false;
  }
}

export default LogTimers;
