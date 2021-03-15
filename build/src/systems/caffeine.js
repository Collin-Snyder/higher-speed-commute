import EntityComponentSystem from "@fritzy/ecs";
export class CaffeineSystem extends EntityComponentSystem.System {
    constructor(_game, ecs, step) {
        super(ecs);
        this._game = _game;
        this.step = step;
    }
    update(tick, entities) {
        for (let entity of entities) {
            for (let cb of entity.CaffeineBoost) {
                cb.wearOff -= this.step;
                if (cb.wearOff <= 0)
                    entity.removeComponent(cb);
            }
        }
    }
}
CaffeineSystem.query = {
    has: ["CaffeineBoost"],
};
