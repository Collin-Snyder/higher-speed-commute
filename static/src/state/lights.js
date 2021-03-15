class LightTimerMachine {
    constructor(intervalMap) {
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
    transition(id, action) {
        let nextState = this.states[this.lights[id].color].on[action];
        this.lights[id].color = nextState;
        this.lights[id].timeSinceLastUpdate = 0;
        return this.lights[id];
    }
    refreshLights(step) {
        var _a;
        const updates = [];
        for (let id in this.lights) {
            let light = this.lights[id];
            let interval = (_a = this.states[this.lights[id].color].interval) !== null && _a !== void 0 ? _a : light.interval;
            light.timeSinceLastUpdate += step;
            if (light.timeSinceLastUpdate >= interval)
                updates.push(this.transition(Number(id), "TIMER"));
        }
        return updates;
    }
}
export default LightTimerMachine;
