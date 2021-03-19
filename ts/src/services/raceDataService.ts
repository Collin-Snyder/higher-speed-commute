import { Entity } from "@fritzy/ecs";

class RaceDataService {
  step: number;
  levelId: number;
  outcome: "win" | "loss" | "crash" | null;
  difficulty: "easy" | "medium" | "hard" | "";
  raceTime: number;
  raceDate: string;
  playerColor: string;
  coffeesConsumed: number[];
  redLightsHit: { [light: string]: number };
  seenRedLights: { [light: string]: number };
  schoolZoneTime: number;

  constructor(
    id: number,
    difficulty: "easy" | "medium" | "hard" | "",
    color: string,
    step: number
  ) {
    this.step = step;
    this.levelId = id;
    this.difficulty = difficulty;
    this.playerColor = color;
    this.outcome = null;
    this.raceTime = 0;
    this.schoolZoneTime = 0;
    this.raceDate = new Date().toISOString();
    this.coffeesConsumed = [];
    this.redLightsHit = {};
    this.seenRedLights = {};
  }

  raceTimeInc() {
    this.raceTime += this.step;
  }

  schoolZoneTimeInc() {
    this.schoolZoneTime += this.step;
  }

  logRedLight(light: Entity) {
    let id;
    let lightId = light.id.match(/\d+/g) || ["0"];
    id = lightId[0];

    if (this.redLightsHit[id]) {
      if (!this.seenRedLights.hasOwnProperty(id)) {
        this.redLightsHit[id]++;
        this.seenRedLights[id] = 5000 - light.Timer.timeSinceLastInterval;
      }
    } else {
      this.redLightsHit[id] = 1;
      this.seenRedLights[id] = 5000 - light.Timer.timeSinceLastInterval;
    }
  }

  logCoffee(id: number) {
    this.coffeesConsumed.push(id);
  }

  exportForSave(outcome: "won" | "lost" | "crash"): IRaceDataExport {
    let save = {
      outcome,
      coffeesConsumed: this.coffeesConsumed,
      difficulty: this.difficulty,
      levelId: this.levelId,
      playerColor: this.playerColor,
      raceDate: this.raceDate,
      raceTime: this.raceTime,
      redLightsHit: this.redLightsHit,
      schoolZoneTime: this.schoolZoneTime,
      coffeesConsumedCount: this.coffeesConsumed.length,
      redLightsHitCount: Object.values(this.redLightsHit).reduce((sum, c) => {
        return sum + c;
      }, 0),
    };
    return save;
  }
}

export default RaceDataService;
