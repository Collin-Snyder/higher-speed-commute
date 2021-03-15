import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { getCenterPoint } from "gameMath";
import { small, regular } from "../modules/breakpoints";
import { ITile } from "../state/map";
const { floor } = Math;
import {Game} from "../main";

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

  constructor(private _game: Game, ecs: any, step: number, ctx: CanvasRenderingContext2D) {
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
    this.map = this.ecs.getEntity("map").MapData.map;
    this.tileMap = this.ecs.getEntity("map").TileData;
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
    this.shrinkDuration =
      (this.states.reveal.duration * 2) / (this.map?.width || 40);
    this.revealElapsedTime = 0;
    this.revealCol = 1;
    this.zoomStep = 0.075;
  }

  isAnimationRunning(): boolean {
    this.map = this.ecs.getEntity("map").MapData.map;
    return this._game.mode === "levelStartAnimation" && this.map;
  }

  onGameBoardStep(): void {
    let { Renderable } = this.ecs.getEntity("map");
    let newAlpha = this.gameboardAlpha + this.gameboardAlphaStep;
    if (newAlpha > 1) newAlpha = 1;
    Renderable.alpha = newAlpha;
    this.gameboardAlpha = newAlpha;
  }

  onGameBoardDone(): string {
    if (this.gameboardAlpha !== 1) {
      let { Renderable } = this.ecs.getEntity("map");
      Renderable.alpha = 1;
    }
    return "pause1";
  }

  onKeySquareStep(): void {
    let index;
    if (!this.keySquaresVisible.playerHome) {
      index = this.map.getKeySquare("playerHome").tileIndex;
      this.keySquaresVisible.playerHome = true;
    } else if (!this.keySquaresVisible.bossHome) {
      index = this.map.getKeySquare("bossHome").tileIndex;
      this.keySquaresVisible.bossHome = true;
    } else if (!this.keySquaresVisible.office) {
      index = this.map.getKeySquare("office").tileIndex;
      this.keySquaresVisible.office = true;
    }
    this.tileMap.tiles[index].display = true;
  }

  onCountdownStep(): void {
    let spriteMap = this._game.spriteMap;
    if (this.currentTimeRemaining <= 1000 && this.countdownNum > 1) {
      this.countdownNum = 1;
      this.countdownAlpha = 1;
      let cd = this.ecs.getEntity("countdown");
      let sprite = <ISprite>spriteMap.getSprite("countdown1");
      for (let bp of cd.Breakpoint) {
        if (bp.name === "small") bp.width = (sprite.w * small.countdownSize) / sprite.h;
        else if (bp.name === "regular") bp.width = (sprite.w * regular.countdownSize) / sprite.h;
      }
      cd.Renderable.spriteX = sprite.x;
      cd.Renderable.spriteY = sprite.y;
      cd.Renderable.spriteW = sprite.w;
      cd.Renderable.spriteH = sprite.h;
      cd.Renderable.alpha = this.countdownAlpha;
      return;
    } else if (this.currentTimeRemaining <= 2000 && this.countdownNum > 2) {
      this.countdownNum = 2;
      this.countdownAlpha = 1;
      let cd = this.ecs.getEntity("countdown");
      let sprite = <ISprite>spriteMap.getSprite("countdown2");
      for (let bp of cd.Breakpoint) {
        if (bp.name === "small") bp.width = (sprite.w * small.countdownSize) / sprite.h;
        else if (bp.name === "regular") bp.width = (sprite.w * regular.countdownSize) / sprite.h;
      }
      cd.Renderable.spriteX = sprite.x;
      cd.Renderable.spriteY = sprite.y;
      cd.Renderable.spriteW = sprite.w;
      cd.Renderable.spriteH = sprite.h;
      cd.Renderable.alpha = this.countdownAlpha;
      return;
    } else if (this.currentTimeRemaining === 3000) {
      this.countdownNum = 3;
      this.countdownAlpha = 1;
      let sprite = <ISprite>spriteMap.getSprite(`countdown${this.countdownNum}`);
      this.ecs
        .createEntity({
          id: "countdown",
          tags: ["anim"],
          Coordinates: {},
          Renderable: {
            spriteX: sprite.x,
            spriteY: sprite.y,
            spriteW: sprite.w,
            spriteH: sprite.h,
            alpha: this.countdownAlpha,
          },
          Breakpoint: [
            {
              name: "small",
              width: (sprite.w * small.countdownSize) / sprite.h,
              height: small.countdownSize,
            },
            {
              name: "regular",
              width: (sprite.w * regular.countdownSize) / sprite.h,
              height: regular.countdownSize,
            },
          ],
        })
      return;
    }

    this.countdownAlpha -= this.countdownAlphaStep;

    if (this.countdownAlpha < 0) this.countdownAlpha = 0;

    let cd = this.ecs.getEntity("countdown");
    cd.Renderable.alpha = this.countdownAlpha;
    if (this.countdownNum === 1) this.onRevealStep();
  }

  onCountdownDone(): string {
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
    this.tileMap.tiles.forEach((t: ITile) => {
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
        if (t.w === 25) return;
        t.w--;
        t.h--;
        if (light) {
          light.Renderable.renderW = t.w;
          light.Renderable.renderH = t.h;
        }
        if (coffee) {
          coffee.Renderable.renderW = floor(t.w / 2);
          coffee.Renderable.renderH = floor(t.h / 2);
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
          light.Renderable.renderW = t.w;
          light.Renderable.renderH = t.h;
        }
        if (coffee) {
          coffee.Renderable.visible = true;
          coffee.Renderable.renderW = floor(t.w / 2);
          coffee.Renderable.renderH = floor(t.h / 2);
        }
      }
    });
    if (newCol) this.revealCol++;
    this.revealElapsedTime += this.gameStep;
  }

  onZoomStep(): void {
    this._game.currentZoom +=
      (this._game.defaultGameZoom - this._game.currentZoom) * this.zoomStep;
  }

  onZoomDone(): string {
    if (this._game.currentZoom !== this._game.defaultGameZoom)
      this._game.currentZoom = this._game.defaultGameZoom;
    const vb = this.ecs.getEntity("map").ViewBox;
    const { Coordinates, Renderable } = this.ecs.getEntity("player");
    const center = getCenterPoint(
      Coordinates.X,
      Coordinates.Y,
      Renderable.renderW,
      Renderable.renderH
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
    let {
      TileData: { tiles },
    } = this.ecs.getEntity("map");

    tiles.forEach((t: ITile) => {
      t.display = false;
    });

    return "gameboard";
  }

  done(): void {
    this.ecs.getEntity("countdown").destroy();

    this._game.publish("play");
    this.reset();
  }
}

export class BackgroundAnimation extends EntityComponentSystem.System {
  constructor(private _game: Game, ecs: any) {
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
    return this._game.mode === "menu";
  }
}

//maybe have Animation system contain list of animation frames/pacing/etc, and Animation component just holds which type of animation
export class Animation extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Animation"],
  };
  constructor(private _game: Game, ecs: any) {
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

  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Set<Entity>) {
    let game = this.ecs.getEntity("global").Global.game;
    let et = game.totalElapsedTime;
    //for each entity
    for (let entity of entities) {
      let {
        startTime,
        duration,
        easing,
        keyframes,
        repeat,
        direction,
      } = entity.Animation;
      //find current p value: (current et - start time) / duration
      let p = (et - startTime) / duration;
      //if easing, apply easing function to get eased p value
      //if reversed, p = 100 - p
      if (direction === "reverse") p = 100 - p;
      //get prev keyframe and next keyframe
      let prevkf;
      //for each prop in prev keyframe, calculate new value
      //p value between prev and next p * diff between prev and next value + prev value
      //update entity's corresponding component/property to new value
    }
  }

  getKeyframes(kf: any[], p: number) {}
}

//for each animation component
//determine position relative to whole animation
//use position to find prev and next keyframes
//determine position between prev and next keyframes
//for each property of each component of the keyframes,
//calculate current value of property based on position
//if easing, run value through appropriate easing function to get final value
//apply value to matching property on entity's actual component
