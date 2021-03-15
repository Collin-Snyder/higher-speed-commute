import ECS from "@fritzy/ecs";
export class LightTimerSystem extends ECS.System {
    constructor(_game, ecs, step) {
        super(ecs);
        this._game = _game;
        this.step = step;
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
    update(tick, entities) {
        var _a;
        const lightEntities = [...entities];
        for (let lightEntity of lightEntities) {
            let { Timer } = lightEntity;
            let interval = (_a = this.states[lightEntity.Color.color].interval) !== null && _a !== void 0 ? _a : Timer.interval;
            Timer.timeSinceLastInterval += this.step;
            if (Timer.timeSinceLastInterval >= interval) {
                this.transition(lightEntity, "TIMER");
            }
        }
    }
    transition(lightEntity, action) {
        let { Color, Timer, Renderable } = lightEntity;
        let nextColor = this.states[Color.color].on[action];
        let sprite = this.ecs
            .getEntity("global")
            .Global.game.spriteMap.getSprite(`${nextColor}Light`);
        Color.color = nextColor;
        Timer.timeSinceLastInterval = 0;
        Renderable.spriteX = sprite.x;
        Renderable.spriteY = sprite.y;
    }
}
LightTimerSystem.query = {
    has: ["Color", "Timer"],
};
