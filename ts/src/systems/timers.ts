import ECS, { Entity } from "@fritzy/ecs";

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

    constructor(ecs: any, step: number) {
      super(ecs);
      this.step = step;
    }
  
    update(tick: number, entities: Set<Entity>) {
        let game = this.ecs.getEntity("global").Global.game;

        if (game.mode !== "playing") return;

        let race = game.currentRace;

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