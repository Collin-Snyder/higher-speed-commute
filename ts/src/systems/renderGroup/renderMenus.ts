import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { centerWithin, alignItems, justifyItems } from "gameMath";
import * as breakpoints from "../../staticData/breakpointData";
import { capitalize } from "gameHelpers";
const { floor, PI } = Math;

type TGetGameplayMenuButtonsMethodName =
  | "getWonMenuButtons"
  | "getLostMenuButtons"
  | "getCrashMenuButtons"
  | "getPausedMenuButtons";

class RenderMenus extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Button", "Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;
  private spriteSheet: HTMLImageElement;
  private menuTags: { [key: string]: Array<string> };
  private modeNames: string[];
  private global: Entity;
  private menuText: { [key: string]: string };

  constructor(private _game: Game, ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.global = this.ecs.getEntity("global");
    let { spriteSheet, spriteMap } = this.global.Global.game;
    this.spriteSheet = spriteSheet;
    this.menuTags = {
      menu: ["main"],
      designing: ["design"],
      paused: ["gameplay", "paused"],
      won: ["gameplay", "won"],
      lost: ["gampeplay", "lost"],
      crash: ["gameplay", "crash"],
      end: ["end"],
    };
    this.modeNames = Object.keys(this.menuTags);
    this.menuText = {
      won: "Nice work!\nYour boss will never know.",
      lost: "Ouch, you're late.\nJust don't let it happen again.",
      crash: "You hit your boss??\nYou'll never work in this town again!",
      end:
        "Congratulations!\nYou formed a habit AND made employee of the quarter.\nNow - time for some PTO.",
    };
  }

  update(tick: number, entities: Set<Entity>) {
    let { mode, playMode } = this._game;

    if (!this.modeNames.includes(mode)) return;

    let {
      Border,
      Coordinates,
      Renderable: { renderW, renderH },
    } = this.ecs.getEntity("map");

    let { weight } = Border ?? { weight: 0 };
    let { X, Y } = Coordinates ?? { X: 0, Y: 0 };

    let borderX = X - weight;
    let borderY = Y - weight;
    let borderWidth = renderW + weight * 2;
    let borderHeight = renderH + weight * 2;

    switch (mode) {
      case "menu":
        this.renderMainMenu();
        return;
      case "paused":
      case "won":
      case "lost":
      case "crash":
        this.renderGameplayMenu(mode, playMode, X, Y, renderW, renderH);
        return;
      case "designing":
        let { saved } = this._game.designModule;
        this.renderDesignMenus(
          borderX,
          borderY,
          borderWidth,
          borderHeight,
          saved
        );
        return;
      case "end":
        this.renderEndOfGameMenu();
      default:
        return;
    }
  }

  getButtonEntity = (buttonName: TButtonName) => {
    let e = <Entity>this.ecs.getEntity(`${buttonName}Button`);
    // e.Interactable.enabled = true;
    return e;
  };

  drawButtonText(buttonEntities: Entity[]) {
    let textButtons = buttonEntities.filter((b) => b.has("Text"));

    if (!textButtons.length) return;

    // console.log(`About to draw ${textButtons.length} button texts`)
    for (let entity of textButtons) {
      let {
        textSpriteX,
        textSpriteY,
        textSpriteW,
        textSpriteH,
        textRenderW,
        textRenderH,
      } = entity.Text;

      let { x, y } = centerWithin(
        entity.Coordinates.X,
        entity.Coordinates.Y,
        entity.Renderable.renderW,
        entity.Renderable.renderH,
        textRenderW,
        textRenderH
      );

      this.ctx.drawImage(
        this.spriteSheet,
        textSpriteX,
        textSpriteY,
        textSpriteW,
        textSpriteH,
        x,
        y,
        textRenderW,
        textRenderH
      );
    }
  }

  showPressedButtons(buttonEntities: Entity[]) {
    for (let be of buttonEntities) {
      if (!be.Button.depressed) continue;

      let imageData = this.ctx.getImageData(
        be.Coordinates.X,
        be.Coordinates.Y,
        be.Renderable.renderW,
        be.Renderable.renderH
      );

      let { data } = imageData;

      for (let p = 0; p < data.length; p += 4) {
        data[p] = data[p] - 50;
        data[p + 1] = data[p + 1] - 50;
        data[p + 2] = data[p + 2] - 50;
      }

      this.ctx.putImageData(imageData, be.Coordinates.X, be.Coordinates.Y);
    }
  }

  drawButtons(buttonEntities: Entity[]) {
    for (let entity of buttonEntities) {
      this.ctx.drawImage(
        this.spriteSheet,
        entity.Renderable.spriteX,
        entity.Renderable.spriteY,
        entity.Renderable.spriteW,
        entity.Renderable.spriteH,
        floor(entity.Coordinates.X),
        floor(entity.Coordinates.Y),
        floor(entity.Renderable.renderW),
        floor(entity.Renderable.renderH)
      );
    }
    this.drawButtonText(buttonEntities);
    this.showPressedButtons(buttonEntities);
  }

  drawTitle() {
    let sprite = <ISprite>this._game.spriteMap.getSprite("title");
    let renderH = breakpoints[this._game.breakpoint].titleHeight;
    let renderW = renderH * (sprite.w / sprite.h);

    let { x } = centerWithin(
      0,
      0,
      window.innerWidth,
      window.innerHeight / 3,
      renderW,
      renderH
    );

    this.ctx.drawImage(
      this.spriteSheet,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      x,
      window.innerHeight / 8,
      renderW,
      renderH
    );

    return { titleY: window.innerHeight / 8, titleHeight: renderH };
  }

  renderMainMenu() {
    // let btns = menuButtons.main.deepMap(this.getButtonEntity);
    let btns = this._game.buttonService.getMainMenuButtons() as
      | Entity[]
      | Entity[][];
    let { titleY, titleHeight } = this.drawTitle();
    let menuY = titleY + titleHeight;
    let menuH = (window.innerHeight / 3) * 2 - window.innerHeight / 8;

    btns = alignItems(
      window.innerWidth / 2 - window.innerWidth / 4,
      menuY,
      window.innerWidth / 2,
      menuH,
      btns,
      "spaceEvenly"
    );
    this.drawButtons(btns);
  }

  drawShine(
    menu: "paused" | "won" | "lost" | "crash" | "end",
    graphicX: number,
    graphicY: number,
    graphicW: number,
    graphicH: number
  ) {
    let graphic = this.ecs.getEntity(`${menu}Graphic`);
    let { degOffset, startSprite } = graphic.Animation;
    let shineSprite = startSprite;
    let spriteW = shineSprite.w;
    let spriteH = shineSprite.h;
    let radians = (degOffset * PI) / 180;
    let transX = graphicX + graphicW / 2;
    let transY = graphicY + graphicH / 2;
    let shineRenderW = graphicW > graphicH ? graphicW : graphicH;
    let graphicShrink = 0.7;
    let shineXOffset = (shineRenderW - graphicW) / 2;
    let shineYOffset = (shineRenderW - graphicH) / 2;

    //rotate and draw clockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineSprite.x,
      shineSprite.y,
      spriteW,
      spriteH,
      graphicX - shineXOffset,
      graphicY - shineYOffset,
      shineRenderW,
      shineRenderW
    );
    this.ctx.restore();

    //rotate and draw counterclockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(-radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineSprite.x,
      shineSprite.y,
      spriteW,
      spriteH,
      graphicX - shineXOffset,
      graphicY - shineYOffset,
      shineRenderW,
      shineRenderW
    );
    this.ctx.restore();

    //calculate position of trophy graphic within shine
    let trophyPosition = centerWithin(
      graphicX,
      graphicY,
      graphicW,
      graphicH,
      (graphicW *= graphicShrink),
      (graphicH *= graphicShrink)
    );

    graphicX = trophyPosition.x;
    graphicY = trophyPosition.y;

    //return position/dimensions of inner trophy graphic
    return { ix: graphicX, iy: graphicY, iw: graphicW, ih: graphicH };
  }

  drawMenuText(
    menu: "won" | "lost" | "crash" | "end",
    textX: number,
    textY: number,
    textH: number,
    maxW: number
  ): number {
    let textSegments = this.menuText[menu].split(`\n`);
    let totalH = 0;
    let bigTextH = textH * 1.5;
    let topGap = bigTextH * 0.5;
    let lineGap = bigTextH * 0.5;
    let l1Y = textY + topGap;
    let l2Y = l1Y + bigTextH + lineGap;
    let l3Y = l2Y + textH + lineGap;

    let fontStr = `${floor(bigTextH)}px '${this._game.gameFont.family}'`;

    this.ctx.save();
    this.ctx.font = fontStr;
    this.ctx.textAlign = "center";

    this.ctx.fillStyle = menu === "end" ? "black" : "white";

    this.ctx.fillText(textSegments[0], textX, l1Y, maxW);
    totalH += topGap + bigTextH;

    if (textSegments[1]) {
      fontStr = fontStr.replace(/\d+(?=px)/, `${textH}`);
      this.ctx.font = fontStr;
      this.ctx.fillText(textSegments[1], textX, l2Y, maxW);
      totalH += lineGap + textH;
    }

    if (textSegments[2]) {
      this.ctx.fillText(textSegments[2], textX, l3Y, maxW);
      totalH += lineGap + textH;
    }

    totalH += topGap;
    this.ctx.restore();
    return totalH;
  }

  drawGameplayMenuGraphic(
    menu: "paused" | "won" | "lost" | "crash",
    mapX: number,
    mapY: number,
    mapW: number,
    mapH: number
  ) {
    let hasShine = menu === "won" || menu === "crash";
    let sprite = <ISprite>this._game.spriteMap.getSprite(`${menu}Graphic`);
    let heightToWidthRatio = sprite.h / sprite.w;
    let graphicH, graphicW;

    if (sprite.h >= sprite.w) {
      graphicH = mapH / 2.8;
      graphicW = graphicH / heightToWidthRatio;
    } else {
      graphicW = mapH / 2.8;
      graphicH = graphicW * heightToWidthRatio;
    }

    let graphicX, graphicY;
    let containerH = mapH / 2.5;

    let { x, y } = centerWithin(
      mapX,
      mapY,
      mapW,
      containerH,
      graphicW,
      graphicH
    );

    graphicX = x;
    graphicY = y;

    if (hasShine) {
      let { ix, iy, ih, iw } = this.drawShine(
        menu,
        graphicX,
        graphicY,
        graphicW,
        graphicH
      );
      graphicX = ix;
      graphicY = iy;
      graphicW = iw;
      graphicH = ih;
    }

    this.ctx.drawImage(
      this.spriteSheet,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );

    return containerH;
  }

  renderGameplayMenu(
    menu: "won" | "lost" | "paused" | "crash",
    playMode: TPlayMode,
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    // let menuName = "paused";
    // if (menu !== "paused") menuName = `${menu}_${playMode}`;
    // let btns = menuButtons[menuName as TMenuName].deepMap(this.getButtonEntity);
    let getButtonsMethod = `get${capitalize(
      menu
    )}MenuButtons` as TGetGameplayMenuButtonsMethodName;
    let btns = this._game.buttonService[getButtonsMethod](
      playMode
    ) as TEntityArrayItem[];

    //draw translucent dark rectangle over map
    this.ctx.save();
    this.ctx.globalAlpha = 0.75;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    this.ctx.restore();

    //draw menu graphic and retain size/position
    let containerH = this.drawGameplayMenuGraphic(
      menu,
      mapX,
      mapY,
      mapWidth,
      mapHeight
    );
    let menuY = mapY + containerH;
    let menuH = (mapHeight / 2.5) * 2 - mapHeight / 4;

    //if the menu has text, draw it and retain size/position
    if (menu !== "paused") {
      let textH = mapHeight / 32;
      let totalH = this.drawMenuText(
        menu,
        mapWidth / 2 + mapX,
        menuY,
        textH,
        mapWidth
      );
      menuY += totalH;
      menuH -= totalH;
    }

    let alignedBtns = alignItems(
      mapX,
      menuY,
      mapWidth,
      menuH,
      btns,
      "spaceEvenly"
    );
    this.drawButtons(alignedBtns);
  }

  renderDesignToolbarMenu(
    toolbarBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    toolbarBtns = justifyItems(
      mapX,
      0,
      mapWidth,
      mapY,
      toolbarBtns,
      "spaceEvenly"
    );
    this.drawButtons(toolbarBtns);
  }

  renderDesignAdminMenu(
    adminBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    adminBtns = alignItems(
      mapX + mapWidth,
      mapY,
      (window.innerWidth - mapWidth) / 2,
      mapHeight,
      adminBtns,
      "top",
      "center",
      adminBtns[0].Renderable.renderH / 2
    );
    this.drawButtons(adminBtns);
  }

  renderDesignConfigMenu(
    configBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    let padding = configBtns[0]?.Renderable
      ? configBtns[0].Renderable.renderH / 2
      : configBtns[0][0]?.Renderable.renderH / 2 || 0;
    configBtns = alignItems(
      0,
      mapY,
      (window.innerWidth - mapWidth) / 2,
      mapHeight,
      configBtns,
      "top",
      "center",
      padding
    );
    this.drawButtons(configBtns);
  }

  renderDesignMenus(
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number,
    saved: boolean
  ) {
    // const toolbarBtns = designMenuButtons.toolbar.deepMap(this.getButtonEntity);
    const toolbarBtns = this._game.buttonService.getDesignMenuButtons(
      "toolbar"
    ) as Entity[];
    // const adminBtns = designMenuButtons.admin
    //   .deepMap(this.getButtonEntity)
    const adminBtns = this._game.buttonService
      .getDesignMenuButtons("admin")
      ?.filter((e) => {
        if (!saved) return true;
        let visible = !/save/.test(e.id);
        // if (!visible) e.Interactable.enabled = false;
        if (!visible) this._game.buttonService.disableButton(e);
        return visible;
      }) as Entity[];
    // const configBtns = designMenuButtons.config.deepMap(this.getButtonEntity);
    const configBtns = this._game.buttonService.getDesignMenuButtons(
      "config"
    ) as Entity[];

    this.renderDesignToolbarMenu(toolbarBtns, mapX, mapY, mapWidth, mapHeight);
    this.renderDesignAdminMenu(adminBtns, mapX, mapY, mapWidth, mapHeight);
    this.renderDesignConfigMenu(configBtns, mapX, mapY, mapWidth, mapHeight);
  }

  formatDesignConfigButtons(configBtns: Entity[]) {
    let btns = [];
    let subarray = [];

    for (let b of configBtns) {
      if (/undo|redo/.test(b.id)) subarray.push(b);
      else btns.push(b);
    }

    btns.unshift(subarray);

    return btns;
  }

  drawEndOfGameGraphic() {
    let sprite = <ISprite>this._game.spriteMap.getSprite("endGraphic");
    let renderH = window.innerHeight / 3;
    let renderW = renderH;

    let x = window.innerWidth / 2 - renderW / 2;
    let y = window.innerHeight / 12;

    this.ctx.drawImage(
      this.spriteSheet,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      x,
      y,
      renderW,
      renderH
    );

    return { graphicY: window.innerHeight / 6, graphicHeight: renderH };
  }

  renderEndOfGameMenu() {
    // let btns = menuButtons.end.deepMap(this.getButtonEntity);
    let btns = this._game.buttonService.getEndMenuButtons();
    let { graphicY, graphicHeight } = this.drawEndOfGameGraphic();
    let textY = graphicY + graphicHeight;

    let textH = this.drawMenuText(
      "end",
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / 32,
      window.innerWidth
    );
    let menuY = textY + textH;
    let menuH = window.innerHeight / 2 - textH;

    btns = alignItems(0, menuY, window.innerWidth, menuH, btns, "spaceEvenly");
    this.drawButtons(btns);
  }
}

export default RenderMenus;
