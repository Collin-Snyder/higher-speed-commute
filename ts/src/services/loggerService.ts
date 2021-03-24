import Game from "../main";

class LogTimer {
  public ready: boolean;
  public running: boolean;
  public msRemaining: number;
  public ticksRemaining: number;

  constructor(
    public unitsPerStep: number,
    public unit: TLoggerUnit
  ) {
    this.ready = false;
    this.running = true;
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
    if (!this.running) return;
    if (this.unit === "ms") this.msRemaining -= et;
    else this.ticksRemaining--;

    //@ts-ignore
    if (this[`${this.unit}Remaining`] <= 0) {
      this.ready = true;
      //@ts-ignore
      this[`${this.unit}Remaining`] = this.unitsPerStep;
    }
  }

  stop() {
    if (!this.running) return false;
    this.running = false;
    return true;
  }

  start() {
    if (this.running) return false;
    this.running = true;
    return true;
  }
}

export default class LogTimers {
  public timers: { [name: string]: LogTimer };
  private game: Game;
  constructor(game: Game) {
    this.timers = {};
    this.game = game;
  }

  addTimer(name: string, unit: TLoggerUnit, unitsPerStep: number) {
    this.timers[name] = new LogTimer(unitsPerStep, unit);
    return true;
  }

  addTimerIfNotExisting(name: string, unit: TLoggerUnit, unitsPerStep: number) {
    if (this.timers.hasOwnProperty(name)) return false;
    return this.addTimer(name, unit, unitsPerStep);
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

  logIfReady(name: string, ...thingsToLog: any[]) {
    if (this.timers[name] && this.timers[name].ready) {
      this.timers[name].log(...thingsToLog);
    }
  }

  forceLog(name: string, ...thingsToLog: any[]) {
    this.timers[name].log(...thingsToLog);
  }

  has(name: string) {
    if (this.timers.hasOwnProperty(name)) return true;
    return false;
  }

  stop(name: string) {
    if (!this.timers.hasOwnProperty(name)) return false;
    return this.timers[name].stop();
  }

  stopAll() {
    for (let name in this.timers) {
        this.timers[name].stop();
    }
    return true;
  }

  start(name: string) {
    if (!this.timers.hasOwnProperty(name)) return false;
    return this.timers[name].start();
  }

  startAll() {
    for (let name in this.timers) {
        this.timers[name].start();
    }
    return true;
  }
}