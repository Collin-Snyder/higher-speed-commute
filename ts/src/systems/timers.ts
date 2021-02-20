import ECS, { Entity } from "@fritzy/ecs";

import {Game} from "../main";

interface RaceDataObjectInterface {
    levelId: number;
    outcome: "win" | "lose" | "crash" | null;
    difficulty: "easy" | "medium" | "hard" | null;
    raceTime: number;
    winMargin: number;
    raceDate: string;
    playerColor: string;
    coffeesConsumed: number[] | string;
    coffeesConsumedCount: number;
    redLightsHit: { [light: number]: number } | string;
    redLightsHitCount: number;
    schoolZoneTime: number;
  }

export class RaceTimerSystem extends ECS.System {
    private step: number;

    constructor(private _game: Game, ecs: any, step: number) {
      super(ecs);
      this.step = step;
    }
  
    update(tick: number, entities: Set<Entity>) {
        if (this._game.mode !== "playing") return;

        let race = this._game.currentRace;

        if (!race) return;

        race.raceTimeInc();

        for (let l in race.seenRedLights) {
          race.seenRedLights[l] -= this.step;
          if (race.seenRedLights[l] <= 0) delete race.seenRedLights[l];
        }
        
        let player = this.ecs.getEntity("player");

        if (player.has("SchoolZone")) race.schoolZoneTimeInc();
    }
}