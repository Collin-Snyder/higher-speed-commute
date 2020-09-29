import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { centerWithin } from "../modules/gameMath";

interface AnimationStateInterface {
  duration: number;
  step: number;
  onStep: Function;
  onDone: Function;
  [key: string]: any;
}

abstract class Animation extends EntityComponentSystem.System {
  public gameStep: number;
  public currentState: string;
  public currentStep: number;
  public currentTimeRemaining: number;
  public states: { [state: string]: AnimationStateInterface };

  constructor(ecs: any, step: number) {
    super(ecs);
    this.gameStep = step;
    this.currentState = "start";
    this.currentStep = 0;
    this.currentTimeRemaining = 0;
    this.states = {};
  }

  update(tick: number, entities: Set<Entity>) {
    if (!this.isAnimationRunning()) return;
    // if (this.currentState === "start") this.onStart();
    else if (this.currentTimeRemaining > 0) this.nextStep();
    else this.transition();
  }

  transition(): void {
    const { onDone } = this.states[this.currentState];
    let nextState = onDone();
    if (nextState === "done") this.done();
    else {
      let { duration, step, stepStart } = this.states[nextState];
      this.currentState = nextState;
      this.currentTimeRemaining = duration;
      this.currentStep = stepStart ?? step;
    }
  }

  nextStep(): void {
    const { onStep, step } = this.states[this.currentState];
    this.currentTimeRemaining -= this.gameStep;
    this.currentStep -= this.gameStep;
    if (this.currentStep <= 0) {
      onStep();
      this.currentStep = step;
    }
  }

  abstract isAnimationRunning(): boolean;
  //   abstract onStart(): void;
  abstract done(): void;
}

export class LevelStartAnimation extends Animation {
  private ctx: CanvasRenderingContext2D;
  private gameboardAlpha: number;
  private gameboardAlphaStep: number;
  private tiles: Array<string | Array<string>>;
  private keySquaresVisible: { [key: string]: boolean };

  constructor(ecs: any, step: number, ctx: CanvasRenderingContext2D) {
    super(ecs, step);
    this.ctx = ctx;
    this.states = {
      start: {
        onDone: this.onStart.bind(this),
        onStep: function() {},
        duration: 0,
        step: 0,
      },
      gameboard: {
        onDone: this.onGameBoardDone.bind(this),
        onStep: this.onGameBoardStep.bind(this),
        duration: 500,
        step: this.gameStep,
      },
      pause1: {
        onDone: function() {
          return "keySquares";
        },
        onStep: function() {},
        duration: 1000,
        step: this.gameStep,
      },
      keySquares: {
        onDone: function() {
          return "pause2";
        },
        onStep: this.onKeySquareStep.bind(this),
        duration: 900,
        step: 300,
        stepStart: 0,
      },
      pause2: {
        onDone: function() {
          return "countdown";
        },
        onStep: function() {},
        duration: 1000,
        step: this.gameStep,
      },
      countdown: {
        onDone: this.onCountdownDone.bind(this),
        onStep: this.onCountdownStep.bind(this),
        duration: 3000,
        step: 1000,
        stepStart: 0,
      },
    };
    this.currentState = "start";
    this.currentStep = this.states[this.currentState].step;
    this.currentTimeRemaining = this.states[this.currentState].duration;
    this.gameboardAlpha = 0;
    this.gameboardAlphaStep = Number(
      (
        1 /
        Math.floor(this.states.gameboard.duration / this.states.gameboard.step)
      ).toFixed(3)
    );
    this.tiles = new Array(1000).fill("");
    this.keySquaresVisible = {
      playerHome: false,
      bossHome: false,
      office: false,
    };
  }

  isAnimationRunning(): boolean {
    let global = this.ecs.getEntity("global").Global;
    return global.game.mode === "levelStartAnimation";
  }

  onGameBoardStep(): void {
    let mapEntity = this.ecs.getEntity("map");
    let newAlpha =
      this.gameboardAlpha + this.gameboardAlphaStep > 1
        ? 1
        : this.gameboardAlpha + this.gameboardAlphaStep;
    mapEntity.Map.background = `rgba(129, 199, 109, ${newAlpha})`;
    this.gameboardAlpha = newAlpha;
  }

  onGameBoardDone(): string {
    if (this.gameboardAlpha !== 1) {
      let mapEntity = this.ecs.getEntity("map");
      mapEntity.Map.background = `rgba(129, 199, 109, 1)`;
    }
    return "pause1";
  }

  onKeySquareStep(): void {
    let mapEntity = this.ecs.getEntity("map");
    let index;
    if (!this.keySquaresVisible.playerHome) {
      index = mapEntity.Map.map.getKeySquare("playerHome").tileIndex();
      this.tiles[index] = "playerHome";
      this.keySquaresVisible.playerHome = true;
    } else if (!this.keySquaresVisible.bossHome) {
      index = mapEntity.Map.map.getKeySquare("bossHome").tileIndex();
      this.tiles[index] = "bossHome";
      this.keySquaresVisible.bossHome = true;
    } else if (!this.keySquaresVisible.office) {
      index = mapEntity.Map.map.getKeySquare("office").tileIndex();
      this.tiles[index] = "office";
      this.keySquaresVisible.office = true;
    }
    mapEntity.TileMap.tiles = this.tiles;
  }

  onCountdownStep(): void {
    if (this.currentTimeRemaining <= 1000) console.log(1);
    else if (this.currentTimeRemaining <= 2000) console.log(2);
    else if (this.currentTimeRemaining <= 3000) console.log(3);
  }

  onCountdownDone(): string {
    console.log("GO!");
    let mapEntity = this.ecs.getEntity("map");
    mapEntity.TileMap.tiles = mapEntity.Map.map.generateTileMap();
    return "done";
  }

  reset(): void {
    this.currentState = "start";
    this.currentStep = this.states[this.currentState].step;
    this.currentTimeRemaining = this.states[this.currentState].duration;
    this.gameboardAlpha = 0;
    this.gameboardAlphaStep = Number(
      (
        1 /
        Math.floor(this.states.gameboard.duration / this.states.gameboard.step)
      ).toFixed(3)
    );
    this.tiles = new Array(1000).fill("");
    this.keySquaresVisible = {
      playerHome: false,
      bossHome: false,
      office: false,
    };
  }

  onStart(): string {
    let mapEntity = this.ecs.getEntity("map");
    console.log("resetting tilemap")
    mapEntity.TileMap.tiles = this.tiles;
    return "gameboard";
  }

  done(): void {
    let game = this.ecs.getEntity("global").Global.game;
    game.publish("play");
    this.reset();
  }
}

//gameboard fades in (500 ms/ 1/30s)
//1s pause
//key squares appear (add "pop" animations later) - 300ms gap?
//1s pause
//countdown 3...2...1...
//whole map spirals in (3s during countdown)
//go!
//cars appear and boss starts
