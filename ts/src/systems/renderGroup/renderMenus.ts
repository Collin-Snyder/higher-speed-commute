import EntityComponentSystem, { Entity, ECS } from "@fritzy/ecs";
import { Game } from "../../main";
import { centerWithin } from "../../modules/gameMath";

class RenderMenus extends EntityComponentSystem.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Button", "Coordinates", "Renderable"],
  };
  private ctx: CanvasRenderingContext2D;
  private spriteSheet: HTMLImageElement;
  private spriteMap: { [key: string]: { X: number; Y: number } };
  private menuTags: { [key: string]: Array<string> };
  private modeNames: string[];
  private buttonEntities: Entity[];
  private global: Entity;
  private menuText: { [key: string]: string };
  private menuFont: FontFace;
  private fontReady: boolean;

  constructor(ecs: ECS, ctx: CanvasRenderingContext2D) {
    super(ecs);
    this.ctx = ctx;
    this.global = this.ecs.getEntity("global");
    let { spriteSheet, spriteMap } = this.global.Global;
    this.spriteSheet = spriteSheet;
    this.spriteMap = spriteMap;
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
    this.buttonEntities = [];
    this.menuText = {
      won: "Nice work!\nYour boss will never know.",
      lost: "Ouch, you're late.\nJust don't let it happen again.",
      crash: "You hit your boss??\nYou'll never work in this town again!",
      end:
        "Congratulations!\nYou formed a habit AND made employee of the quarter.\nNow - time for some PTO.",
    };
    // this.menuFont = new FontFace("8-bit-pusab-regular", "url('../../8-bit-pusab.ttf')");
    this.fontReady = false;
    this.menuFont = new FontFace(
      "8-bit-pusab-regular",
      "url('../../8-bit-pusab.ttf')"
    );
    document.fonts.add(this.menuFont);
    this.menuFont.loaded.then(this.logFontLoaded);

    this.menuFont
      .load()
      .then((f) => document.fonts.add(f))
      .then((f) => document.fonts.ready)
      .then((r) => (this.fontReady = true))
      .catch((err) => console.error(err));
  }

  update(tick: number, entities: Set<Entity>) {
    let global = this.ecs.getEntity("global").Global;
    let game = <Game>global.game;
    let { mode, playMode } = game;

    //calculate coordinates for buttons using button spacing logic and current state/size of game
    if (!this.modeNames.includes(mode)) return;
    this.buttonEntities = this.selectButtons(mode, playMode);
    this.buttonEntities.forEach((e) => {
      if (e.has("NI")) e.removeTag("NI");
    });
    let {
      MapData: { map },
      Border,
      Coordinates,
      Renderable: { renderWidth, renderHeight },
    } = this.ecs.getEntity("map");

    // let { pixelWidth, pixelHeight } = map ?? {
    //   pixelHeight: 0,
    //   pixelWidth: 0,
    // };
    let { weight } = Border ?? { weight: 0 };
    let { X, Y } = Coordinates ?? { X: 0, Y: 0 };

    let borderX = X - weight;
    let borderY = Y - weight;
    let borderWidth = renderWidth + weight * 2;
    let borderHeight = renderHeight + weight * 2;

    switch (mode) {
      case "menu":
        this.renderMainMenu();
        return;
      case "paused":
      case "won":
      case "lost":
      case "crash":
        this.renderGameplayMenu(mode, X, Y, renderWidth, renderHeight);
        return;
      case "designing":
        let { saved } = game.designModule;
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

  logFontLoaded = () => {
    console.log(this.menuFont.family, "loaded successfully.");
    this.fontReady = true;
  };

  selectButtons(mode: string, playMode: "arcade" | "custom" | "testing" | "") {
    let btns = [
      ...this.ecs.queryEntities({ has: ["menu", ...this.menuTags[mode]] }),
    ];
    if (playMode) {
      if (mode === "won" || playMode === "testing")
        btns = btns.filter((b) => b.has(playMode));
    }
    return btns;
  }

  positionButtons(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    ew: number,
    eh: number,
    dir: "horizontal" | "vertical",
    buttons: Array<Entity | Array<Entity>>,
    style: "spaceBetween" | "spaceEvenly" = "spaceEvenly"
  ) {
    let { x, y } = centerWithin(
      cx,
      cy,
      cw,
      ch,
      ew,
      eh,
      buttons.length,
      dir,
      style
    );
    let newCoord = dir === "horizontal" ? x.start : y.start;
    for (let btn of buttons) {
      if (Array.isArray(btn)) {
        let subx = dir === "horizontal" ? newCoord : x.start;
        let suby = dir === "vertical" ? newCoord : y.start;
        let subw = dir === "horizontal" ? x.step : ew;
        let subh = dir === "vertical" ? y.step : eh;
        let subew = btn[0].Renderable.renderWidth;
        let subeh = btn[0].Renderable.renderHeight;
        this.positionButtons(
          subx,
          suby,
          subw,
          subh,
          subew,
          subeh,
          dir === "horizontal" ? "vertical" : "horizontal",
          btn,
          "spaceBetween"
        );
      } else {
        btn.Coordinates.Y = dir === "vertical" ? newCoord : y.start;
        btn.Coordinates.X = dir === "horizontal" ? newCoord : x.start;
      }
      if (dir === "vertical") newCoord += y.step;
      else if (dir === "horizontal") newCoord += x.step;
    }
  }

  drawButtons(buttonEntities: Entity[]) {
    for (let entity of buttonEntities) {
      this.ctx.drawImage(
        this.spriteSheet,
        entity.Renderable.spriteX,
        entity.Renderable.spriteY,
        entity.Renderable.spriteWidth,
        entity.Renderable.spriteHeight,
        entity.Coordinates.X,
        entity.Coordinates.Y,
        entity.Renderable.renderWidth,
        entity.Renderable.renderHeight
      );
    }
  }

  drawTitle() {
    let spriteCoords = this.spriteMap.title;
    let spriteW = 195;
    let spriteH = 53;
    let renderH = window.innerHeight / 4;
    let renderW = renderH * (spriteW / spriteH);

    let { x, y } = centerWithin(
      0,
      0,
      window.innerWidth,
      window.innerHeight / 3,
      renderW,
      renderH,
      1,
      "vertical",
      "spaceEvenly"
    );

    this.ctx.drawImage(
      this.spriteSheet,
      spriteCoords.X,
      spriteCoords.Y,
      spriteW,
      spriteH,
      x.start,
      window.innerHeight / 8,
      renderW,
      renderH
    );

    return { titleY: window.innerHeight / 8, titleHeight: renderH };
  }

  renderMainMenu() {
    let { titleY, titleHeight } = this.drawTitle();
    let menuY = titleY + titleHeight;
    let menuH = (window.innerHeight / 3) * 2 - window.innerHeight / 8;
    this.positionButtons(
      window.innerWidth / 2 - window.innerWidth / 4,
      menuY,
      window.innerWidth / 2,
      menuH,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  drawShine(
    menu: "paused" | "won" | "lost" | "crash" | "end",
    graphicX: number,
    graphicY: number,
    graphicW: number,
    graphicH: number
  ) {
    let graphic = window.game.ecs.getEntity(`${menu}Graphic`);
    let { degOffset, startSprite } = graphic.Animation;
    let shineCoords = startSprite;
    let spriteW = 75;
    let spriteH = 75;
    let radians = (degOffset * Math.PI) / 180;
    let transX = graphicX + graphicW / 2;
    let transY = graphicY + graphicH / 2;

    //rotate and draw clockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineCoords.X,
      shineCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );
    this.ctx.restore();

    //rotate and draw counterclockwise shine
    this.ctx.save();
    this.ctx.translate(transX, transY);
    this.ctx.rotate(-radians);
    this.ctx.translate(-transX, -transY);
    this.ctx.drawImage(
      this.spriteSheet,
      shineCoords.X,
      shineCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );
    this.ctx.restore();

    //calculate position of trophy graphic within shine
    let trophyPosition = centerWithin(
      graphicX,
      graphicY,
      graphicW,
      graphicH,
      (graphicW *= 0.7),
      (graphicH *= 0.7),
      1,
      "vertical",
      "spaceEvenly"
    );

    graphicX = trophyPosition.x.start;
    graphicY = trophyPosition.y.start;

    //return position/dimensions of inner trophy graphic
    return { ix: graphicX, iy: graphicY, iw: graphicW, ih: graphicH };
  }

  drawMenuText(
    menu: "won" | "lost" | "crash" | "end",
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

    let fontStr = `${Math.floor(bigTextH)}px ${
      this.fontReady ? `'8-bit-pusab-regular'` : `sans-serif`
    }`;

    this.ctx.save();
    this.ctx.font = fontStr;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillStyle = menu === "end" ? "black" : "white";

    // console.log(`Drawing segment "${textSegments[0]}" at Y ${l1Y}`)
    this.ctx.fillText(textSegments[0], window.innerWidth / 2, l1Y, maxW);
    totalH += topGap + bigTextH;

    if (textSegments[1]) {
      fontStr = fontStr.replace(/\d+(?=px)/, `${textH}`);
      this.ctx.font = fontStr;
      // console.log(`Drawing segment "${textSegments[1]}" at Y ${l2Y}`)
      this.ctx.fillText(textSegments[1], window.innerWidth / 2, l2Y, maxW);
      totalH += lineGap + textH;
    }

    if (textSegments[2]) {
      // console.log("text height for line 3: ", textH)
      // fontStr = fontStr.replace(/\d+(?=px)/, `${textH}`);
      // console.log("font str: ", fontStr)
      // this.ctx.font = fontStr;
      // console.log(`Drawing segment "${textSegments[2]}" at Y ${l3Y}`)
      this.ctx.fillText(textSegments[2], window.innerWidth / 2, l3Y, maxW);
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
    let spriteCoords = this.spriteMap[`${menu}Graphic`];
    let hasShine = menu === "won" || menu === "crash";
    let spriteW = 75;
    let spriteH = 75;
    let graphicH = mapH / 3;
    let graphicW = graphicH;
    let graphicX, graphicY;
    let containerH = mapH / 2.5;

    let { x, y } = centerWithin(
      mapX,
      mapY,
      mapW,
      containerH,
      graphicW,
      graphicH,
      1,
      "vertical",
      "spaceEvenly"
    );

    graphicX = x.start;
    graphicY = y.start;

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
      spriteCoords.X,
      spriteCoords.Y,
      spriteW,
      spriteH,
      graphicX,
      graphicY,
      graphicW,
      graphicH
    );

    return containerH;
  }

  renderGameplayMenu(
    menu: "won" | "lost" | "paused" | "crash",
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
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
      // let textH = 75;
      let totalH = this.drawMenuText(menu, menuY, textH, mapWidth);
      menuY += totalH;
      menuH -= totalH;
    }

    //position and draw buttons based on location/size of menu graphic
    this.positionButtons(
      mapX,
      menuY,
      mapWidth,
      menuH,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }

  renderDesignToolbarMenu(
    toolbarBtns: Entity[],
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.positionButtons(
      mapX,
      0,
      mapWidth,
      (window.innerHeight - mapHeight) / 2,
      75,
      75,
      "horizontal",
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
    // let formattedBtns = this.formatDesignAdminButtons(adminBtns);
    this.positionButtons(
      mapX + mapWidth,
      (window.innerHeight - mapHeight) / 2,
      (window.innerWidth - mapWidth) / 2,
      mapHeight,
      200,
      75,
      "vertical",
      adminBtns,
      "spaceEvenly"
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
    let formattedBtns = this.formatDesignConfigButtons(configBtns);
    this.positionButtons(
      0,
      (window.innerHeight - mapHeight) / 2,
      (window.innerWidth - mapWidth) / 2,
      mapHeight,
      200,
      75,
      "vertical",
      formattedBtns,
      "spaceEvenly"
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
    const toolbarBtns = this.buttonEntities.filter((e) => e.has("toolbar"));
    const adminBtns = this.buttonEntities.filter((e) => {
      let isAdmin = e.has("admin");
      if (!saved) return isAdmin;
      if (!isAdmin) return false;
      let visible = !/save/.test(e.id);
      if (!visible && !e.has("NI")) e.addTag("NI");
      return visible;
    });
    const configBtns = this.buttonEntities.filter((e) => e.has("config"));

    this.renderDesignToolbarMenu(toolbarBtns, mapX, mapY, mapWidth, mapHeight);
    this.renderDesignAdminMenu(adminBtns, mapX, mapY, mapWidth, mapHeight);
    this.renderDesignConfigMenu(configBtns, mapX, mapY, mapWidth, mapHeight);
  }

  formatDesignConfigButtons(configBtns: Entity[]) {
    const undoredo = configBtns.filter(
      (b: Entity) => b.Button.name === "undo" || b.Button.name === "redo"
    );
    // const erasereset = adminBtns.filter(
    //   (b) => b.Button.name === "eraser" || b.Button.name === "reset"
    // );
    let btns: Array<Entity | Array<Entity>> = configBtns.slice();
    btns.splice(0, 2, undoredo);
    btns = btns.map((b) => {
      if (!Array.isArray(b)) return [b];
      else return b;
    });
    // btns.splice(5, 2, erasereset);

    return btns;
  }

  drawEndOfGameGraphic() {
    let spriteCoords = this.spriteMap.endGraphic;
    let spriteW = 75;
    let spriteH = 75;
    let renderH = window.innerHeight / 3;
    let renderW = renderH;

    let x = window.innerWidth / 2 - renderW / 2;
    let y = window.innerHeight / 12;

    this.ctx.drawImage(
      this.spriteSheet,
      spriteCoords.X,
      spriteCoords.Y,
      spriteW,
      spriteH,
      x,
      y,
      renderW,
      renderH
    );

    return { graphicY: window.innerHeight / 6, graphicHeight: renderH };
  }

  renderEndOfGameMenu() {
    let { graphicY, graphicHeight } = this.drawEndOfGameGraphic();
    let textY = graphicY + graphicHeight;

    let textH = this.drawMenuText(
      "end",
      window.innerHeight / 2,
      window.innerHeight / 32,
      window.innerWidth
    );
    let menuY = textY + textH;
    let menuH = window.innerHeight / 2 - textH;
    this.positionButtons(
      0,
      menuY,
      window.innerWidth,
      menuH,
      200,
      75,
      "vertical",
      this.buttonEntities,
      "spaceEvenly"
    );
    this.drawButtons(this.buttonEntities);
  }
}

export default RenderMenus;
