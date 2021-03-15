import ECS from "@fritzy/ecs";
export class RaceTimerSystem extends ECS.System {
    constructor(_game, ecs, step) {
        super(ecs);
        this._game = _game;
        this.step = step;
    }
    update(tick, entities) {
        if (this._game.mode !== "playing")
            return;
        let race = this._game.currentRace;
        if (!race)
            return;
        race.raceTimeInc();
        for (let l in race.seenRedLights) {
            race.seenRedLights[l] -= this.step;
            if (race.seenRedLights[l] <= 0)
                delete race.seenRedLights[l];
        }
        let player = this.ecs.getEntity("player");
        if (player.has("SchoolZone"))
            race.schoolZoneTimeInc();
    }
}
