import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { centerWithin, getCenterPoint } from "../modules/gameMath";
import { Tile, TileInterface } from "../state/map";
const { floor } = Math;

interface AnimationStateInterface {
  duration: number;
  step: number;
  onStep: Function;
  onDone: Function;
  [key: string]: any;
}

abstract class StateAnimation extends EntityComponentSystem.System {
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

export class LevelStartAnimation extends StateAnimation {
  private ctx: CanvasRenderingContext2D;
  private gameboardAlpha: number;
  private gameboardAlphaStep: number;
  private tileMap: any;
  private keySquaresVisible: { [key: string]: boolean };
  private countdownNum: number;
  private countdownAlpha: number;
  private countdownAlphaStep: number;
  private map: any;
  private revealCol: number;
  private shrinkDuration: number;
  private revealElapsedTime: number;
  private zoomStep: number;

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
      reveal: {
        onDone: this.onRevealDone.bind(this),
        onStep: this.onRevealStep.bind(this),
        duration: 1000,
        step: this.gameStep,
      },
      zoom: {
        onDone: this.onZoomDone.bind(this),
        onStep: this.onZoomStep.bind(this),
        duration: 1000,
        step: this.gameStep,
      },
    };
    this.currentState = "start";
    this.currentTimeRemaining = this.states[this.currentState].duration;
    this.gameboardAlpha = 0;
    this.gameboardAlphaStep = Number(
      (
        1 /
        Math.floor(this.states.gameboard.duration / this.states.gameboard.step)
      ).toFixed(3)
    );
    this.map = this.ecs.getEntity("map").Map;
    this.tileMap = this.ecs.getEntity("map").TileMap;
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
    this.shrinkDuration = (this.states.reveal.duration * 2) / this.map.width;
    this.revealElapsedTime = 0;
    this.revealCol = 1;
    this.zoomStep = 0.075;
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
    let index;
    if (!this.keySquaresVisible.playerHome) {
      index = this.map.map.getKeySquare("playerHome").tileIndex;
      this.keySquaresVisible.playerHome = true;
    } else if (!this.keySquaresVisible.bossHome) {
      index = this.map.map.getKeySquare("bossHome").tileIndex;
      this.keySquaresVisible.bossHome = true;
    } else if (!this.keySquaresVisible.office) {
      index = this.map.map.getKeySquare("office").tileIndex;
      this.keySquaresVisible.office = true;
    }
    this.tileMap.tiles[index].display = true;
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
    if (this.countdownNum === 1) this.onRevealStep();
  }

  onCountdownDone(): string {
    // let mapEntity = this.ecs.getEntity("map");
    // mapEntity.TileMap.tiles = mapEntity.Map.map.generateTileMap();
    this.onRevealStep();
    return "reveal";
  }

  onRevealDone(): string {
    console.log("GO!");
    this.revealElapsedTime = 0;
    this.revealCol = 1;
    return "zoom";
  }

  onRevealStep(): void {
    let newCol = false;
    this.tileMap.tiles.forEach((t: TileInterface) => {
      let light = this.ecs.getEntity(`light${t.id}`);
      let coffee = this.ecs.getEntity(`coffee${t.id}`);
      if (
        t.col > this.revealCol ||
        t.type === "playerHome" ||
        t.type === "bossHome" ||
        t.type === "office"
      ) {
        return;
      }
      if (t.col < this.revealCol) {
        if (t.w === this.tileMap.tileWidth) return;
        t.w--;
        t.h--;
        if (light) {
          light.Renderable.renderWidth = t.w;
          light.Renderable.renderHeight = t.h;
        }
        if (coffee) {
          coffee.Renderable.renderWidth = floor(t.w / 2);
          coffee.Renderable.renderHeight = floor(t.h / 2);
        }
        return;
      }
      if (
        this.revealElapsedTime >
        this.revealCol * (this.shrinkDuration / 1.5)
      ) {
        t.display = true;
        t.w = 50;
        t.h = 50;
        newCol = true;
        if (light) {
          light.Renderable.visible = true;
          light.Renderable.renderWidth = t.w;
          light.Renderable.renderHeight = t.h;
        }
        if (coffee) {
          coffee.Renderable.visible = true;
          coffee.Renderable.renderWidth = floor(t.w / 2);
          coffee.Renderable.renderHeight = floor(t.h / 2);
        }
      }
    });
    if (newCol) this.revealCol++;
    this.revealElapsedTime += this.gameStep;
  }

  onZoomStep(): void {
    let game = this.ecs.getEntity("global").Global.game;
    game.currentZoom +=
      (game.defaultGameZoom - game.currentZoom) * this.zoomStep;
  }

  onZoomDone(): string {
    let game = this.ecs.getEntity("global").Global.game;
    if (game.currentZoom !== game.defaultGameZoom)
      game.currentZoom = game.defaultGameZoom;
    const vb = this.ecs.getEntity("map").ViewBox;
    const { Coordinates, Renderable } = this.ecs.getEntity("player");
    const center = getCenterPoint(
      Coordinates.X,
      Coordinates.Y,
      Renderable.renderWidth,
      Renderable.renderHeight
    );
    vb.x = center.X - vb.w / 2;
    vb.y = center.Y - vb.h / 2;
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
    this.keySquaresVisible = {
      playerHome: false,
      bossHome: false,
      office: false,
    };
  }

  onStart(): string {
    let tiles = this.ecs.getEntity("map").TileMap.tiles;
    let spriteMap = this.ecs.getEntity("global").Global.spriteMap;

    // console.log("resetting tilemap");
    tiles.forEach((t: TileInterface) => {
      t.display = false;
    });

    return "gameboard";
  }

  done(): void {
    let game = this.ecs.getEntity("global").Global.game;

    this.ecs.getEntity("countdown").destroy();

    game.publish("play");
    this.reset();
  }
}

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

//maybe have Animation system contain list of animation frames/pacing/etc, and Animation component just holds which type of animation
export class Animation extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Animation"],
  };
  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    for (let entity of entities) {
      let a = entity.Animation;
      if (a.frames.length > 0) {
        //if not at end, update entity based on next frame
        //if at end, return to start if looping or else remove animation component
      } else {
        if (a.xStep) {
          a.xOffset += a.xStep;
        }
        if (a.yStep) {
          a.yOffset += a.yStep;
        }
        if (a.degStep) {
          a.degOffset += a.degStep;
        }
      }
    }
  }
}

export const enum Animations {
  DOT_PULSE = "DotPulse",
  ROTATE = "Rotate",
  SCALE = "Scale",
  TRANSLATE = "Translate",
}

export class AnimationSystem extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Animation"],
  };
  public dotPulseData: any;
  constructor(ecs: any) {
    super(ecs);
    this.dotPulseData = {
      maxRadius: 2,
      currentRadius: 1,
      radiusStep: 3 / 4,
    };
  }

  update(tick: number, entities: Set<Entity>) {
    for (let entity of entities) {
      let animation: Animations = entity.Animation.name;
      // @ts-ignore
      this[`run${animation}`](entity, animation);
    }
  }

  runDotPulse(entity: Entity) {
    let { maxRadius, currentRadius } = this.dotPulseData;
    //every run, the radius expands by the step amount until it reaches (or is very close to) the max radius
    //every run, the
  }
}
