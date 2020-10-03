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

  constructor(ecs: ECS, step: number) {
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
    this.currentStep -= this.gameStep;
    if (this.currentStep <= 0) {
      onStep();
      this.currentStep = step;
    }
    this.currentTimeRemaining -= this.gameStep;
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
  private countdownNum: number;
  private countdownAlpha: number;
  private countdownAlphaStep: number;

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
        step: this.gameStep,
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
    this.countdownNum = 3;
    this.countdownAlpha = 1;
    this.countdownAlphaStep = Number(
      (1 / Math.floor(1000 / this.states.countdown.step)).toFixed(3)
    );
  }

  isAnimationRunning(): boolean {
    let global = this.ecs.getEntity("global").Global;
    return global.game.mode === "levelStartAnimation";
  }

  onGameBoardStep(): void {
    let mapEntity = this.ecs.getEntity("map");
    let newAlpha = this.gameboardAlpha + this.gameboardAlphaStep;
    if (newAlpha > 1) newAlpha = 1;
    mapEntity.Renderable.alpha = newAlpha;
    this.gameboardAlpha = newAlpha;
  }

  onGameBoardDone(): string {
    if (this.gameboardAlpha !== 1) {
      let mapEntity = this.ecs.getEntity("map");
      mapEntity.Renderable.alpha = 1;
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
    let spriteMap = this.ecs.getEntity("global").Global.spriteMap;
    if (this.currentTimeRemaining <= 1000 && this.countdownNum > 1) {
      this.countdownNum = 1;
      this.countdownAlpha = 1;
      let cd = this.ecs.getEntity("countdown");
      let spriteCoords = spriteMap.countdown1;
      cd.Renderable.spriteX = spriteCoords.X;
      cd.Renderable.spriteY = spriteCoords.Y;
      cd.Renderable.alpha = this.countdownAlpha;
      return;
    } else if (this.currentTimeRemaining <= 2000 && this.countdownNum > 2) {
      this.countdownNum = 2;
      this.countdownAlpha = 1;
      let cd = this.ecs.getEntity("countdown");
      let spriteCoords = spriteMap.countdown2;
      cd.Renderable.spriteX = spriteCoords.X;
      cd.Renderable.spriteY = spriteCoords.Y;
      cd.Renderable.alpha = this.countdownAlpha;
      return;
    } else if (this.currentTimeRemaining === 3000) {
      this.countdownNum = 3;
      this.countdownAlpha = 1;
      console.log("creating countdown entity");
      let spriteCoords = spriteMap[`countdown${this.countdownNum}`];
      this.ecs
        .createEntity({
          id: "countdown",
          Coordinates: {},
          Renderable: {
            spriteX: spriteCoords.X,
            spriteY: spriteCoords.Y,
            spriteWidth: 75,
            spriteHeight: 75,
            renderWidth: 400,
            renderHeight: 400,
            alpha: this.countdownAlpha,
          },
        })
        .addTag("anim");
      return;
    }

    this.countdownAlpha -= this.countdownAlphaStep;

    if (this.countdownAlpha < 0) this.countdownAlpha = 0;

    let cd = this.ecs.getEntity("countdown");
    cd.Renderable.alpha = this.countdownAlpha;
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
    let spriteMap = this.ecs.getEntity("global").Global.spriteMap;

    console.log("resetting tilemap");
    mapEntity.TileMap.tiles = this.tiles;

    return "gameboard";
  }

  done(): void {
    let game = this.ecs.getEntity("global").Global.game;

    this.ecs.getEntity("countdown").destroy();

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

export class BackgroundAnimation extends EntityComponentSystem.System {
  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    if (!this.isAnimationRunning()) return;
    const layers = this.ecs.getEntity("bg").ParallaxLayer;
    for (let layer of layers) {
      layer.offset += layer.step;
      if (layer.offset >= layer.width / 2) {
        layer.offset -= layer.width / 2;
      }
    }
  }

  isAnimationRunning() {
    const game = this.ecs.getEntity("global").Global.game;
    return game.mode === "menu";
  }
}
