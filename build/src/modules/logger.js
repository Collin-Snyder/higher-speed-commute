class LogTimer {
    constructor(
    // public game: Game,
    unitsPerStep, unit) {
        this.unitsPerStep = unitsPerStep;
        this.unit = unit;
        // this.game = game;
        this.ready = false;
        this.running = true;
        this.unit = unit;
        this.unitsPerStep = unitsPerStep;
        if (this.unit === "ms") {
            this.ticksRemaining = 0;
            this.msRemaining = unitsPerStep;
        }
        else {
            this.msRemaining = 0;
            this.ticksRemaining = unitsPerStep;
        }
    }
    log(...thingsToLog) {
        console.log(...thingsToLog);
        this.ready = false;
    }
    update(et) {
        if (!this.running)
            return;
        if (this.unit === "ms")
            this.msRemaining -= et;
        else
            this.ticksRemaining--;
        //@ts-ignore
        if (this[`${this.unit}Remaining`] <= 0) {
            this.ready = true;
            //@ts-ignore
            this[`${this.unit}Remaining`] = this.unitsPerStep;
        }
    }
    stop() {
        if (!this.running)
            return false;
        this.running = false;
        return true;
    }
    start() {
        if (this.running)
            return false;
        this.running = true;
        return true;
    }
}
class LogTimers {
    constructor(game) {
        this.timers = {};
        this.game = game;
    }
    addTimer(name, unit, unitsPerStep) {
        this.timers[name] = new LogTimer(unitsPerStep, unit);
        return true;
    }
    addTimerIfNotExisting(name, unit, unitsPerStep) {
        if (this.timers.hasOwnProperty(name))
            return false;
        return this.addTimer(name, unit, unitsPerStep);
    }
    update() {
        let et = this.game.frameElapsedTime;
        for (let name in this.timers) {
            let t = this.timers[name];
            t.update(et);
        }
    }
    removeTimer(name) {
        if (this.timers.hasOwnProperty(name)) {
            delete this.timers[name];
            return true;
        }
        return false;
    }
    ready(name) {
        var _a;
        return (_a = this.timers[name]) === null || _a === void 0 ? void 0 : _a.ready;
    }
    logIfReady(name, ...thingsToLog) {
        if (this.timers[name] && this.timers[name].ready) {
            this.timers[name].log(...thingsToLog);
        }
    }
    forceLog(name, ...thingsToLog) {
        this.timers[name].log(...thingsToLog);
    }
    has(name) {
        if (this.timers.hasOwnProperty(name))
            return true;
        return false;
    }
    stop(name) {
        if (!this.timers.hasOwnProperty(name))
            return false;
        return this.timers[name].stop();
    }
    stopAll() {
        for (let name in this.timers) {
            this.timers[name].stop();
        }
        return true;
    }
    start(name) {
        if (!this.timers.hasOwnProperty(name))
            return false;
        return this.timers[name].start();
    }
    startAll() {
        for (let name in this.timers) {
            this.timers[name].start();
        }
        return true;
    }
}
class LogTimerNew {
    constructor(options) {
        var _a, _b, _c;
        this.oneTimeLog = (_a = options.oneTimeLog) !== null && _a !== void 0 ? _a : false;
        this.interval = (_b = options.interval) !== null && _b !== void 0 ? _b : 1000;
        this.intervalUnit = (_c = options.intervalUnit) !== null && _c !== void 0 ? _c : "ms";
    }
}
class Logger {
    constructor(_game) {
        this._game = _game;
        this.timers = new Map();
        this.lastTimerId = 0;
    }
    addTimer(options) {
        let id = ++this.lastTimerId;
        this.timers.set(id, new LogTimerNew(options));
        return id;
    }
    log() { }
    cancelLogger(timerId) {
        this.timers.delete(timerId);
    }
}
export default LogTimers;
