import EntityComponentSystem from "@fritzy/ecs";
export class LogSystem extends EntityComponentSystem.System {
    constructor(ecs) {
        super(ecs);
    }
    update(tick, entities) {
        for (let e of entities) {
            let { startTime, startTick, timeSinceLastLog, ticksSinceLastLog, } = e.LogTimer;
            let {};
            //if Options
        }
    }
}
