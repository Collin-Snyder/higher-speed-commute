import Game from "./main";

class SpriteMap {
  private _game: Game;
  private _terrainRows: { [key in TTerrainStyle]: number };
  public spriteData: {
    [key: string]: ISprite;
  };
  public terrainSpriteData: {
    [key: string]: ISprite;
  };
  constructor(game: Game) {
    this._game = game;
    this._terrainRows = {
      default: 151,
      desert: 178,
      snow: 205,
      underwater: 232,
    };
    this.terrainSpriteData = {
      background1: { x: 308, y: 151, w: 25, h: 25 },
      background2: { x: 335, y: 151, w: 25, h: 25 },
      smallObj1: { x: 362, y: 151, w: 25, h: 25 },
      smallObj2: { x: 389, y: 151, w: 25, h: 25 },
      smallObj3: { x: 416, y: 151, w: 25, h: 25 },
      smallObj4: { x: 443, y: 151, w: 25, h: 25 },
      medObj1: { x: 470, y: 151, w: 25, h: 25 },
      medObj2: { x: 497, y: 151, w: 25, h: 25 },
      tree1: { x: 551, y: 151, w: 25, h: 25 },
      tree2: { x: 524, y: 151, w: 25, h: 25 },
      tree3: { x: 578, y: 151, w: 25, h: 25 },
      house: { x: 659, y: 151, w: 25, h: 25 },
      street: { x: 686, y: 151, w: 25, h: 25 },
      schoolZone: { x: 713, y: 151, w: 25, h: 25 },
      playerHome: { x: 605, y: 151, w: 25, h: 25 },
      bossHome: { x: 632, y: 151, w: 25, h: 25 },
      office: { x: 740, y: 151, w: 25, h: 25 },
    };
    this.spriteData = {
      /// CARS ////
      blueCar: { x: 443, y: 124, w: 25, h: 25 },
      redCar: { x: 470, y: 124, w: 25, h: 25 },
      /// GAMEPLAY ENTITIES ///
      redLight: { x: 308, y: 124, w: 25, h: 25 },
      greenLight: { x: 362, y: 124, w: 25, h: 25 },
      yellowLight: { x: 335, y: 124, w: 25, h: 25 },
      coffee: { x: 389, y: 124, w: 25, h: 25 },
      countdown3: { x: 308, y: 527, w: 70, h: 71 },
      countdown2: { x: 380, y: 527, w: 70, h: 71 },
      countdown1: { x: 452, y: 527, w: 22, h: 71 },
      /// DESIGN ENTITIES ///
      designLight: { x: 416, y: 124, w: 25, h: 25 },
      /// DESIGN BUTTONS ///
      playerHomeButton: { x: 308, y: 373, w: 75, h: 75 },
      bossHomeButton: { x: 385, y: 373, w: 75, h: 75 },
      officeButton: { x: 462, y: 373, w: 75, h: 75 },
      streetButton: { x: 539, y: 373, w: 75, h: 75 },
      schoolZoneButton: { x: 616, y: 373, w: 75, h: 75 },
      lightButton: { x: 693, y: 373, w: 75, h: 75 },
      coffeeButton: { x: 770, y: 373, w: 75, h: 75 },
      eraserButton: { x: 847, y: 373, w: 75, h: 75 },
      resetButton: { x: 924, y: 373, w: 75, h: 75 },
      undoButton: { x: 308, y: 450, w: 75, h: 75 },
      redoButton: { x: 385, y: 450, w: 75, h: 75 },
      /// COLORED BUTTONS ///
      greenButton: { x: 0, y: 0, w: 152, h: 57 },
      yellowButton: { x: 0, y: 177, w: 152, h: 57 },
      redButton: { x: 0, y: 118, w: 152, h: 57 },
      purpleButton: { x: 0, y: 59, w: 152, h: 57 },
      orangeButton: { x: 0, y: 236, w: 152, h: 57 },
      /// BUTTON TEXT ///
      designButtonText: { x: 0, y: 319, w: 124, h: 22 },
      saveButtonText: { x: 0, y: 343, w: 82, h: 22 },
      saveAsButtonText: { x: 0, y: 367, w: 135, h: 22 },
      homeButtonText: { x: 0, y: 391, w: 82, h: 22 },
      resumeButtonText: { x: 0, y: 415, w: 124, h: 22 },
      restartButtonText: { x: 0, y: 439, w: 145, h: 22 },
      quitButtonText: { x: 0, y: 463, w: 82, h: 22 },
      nextLevelButtonText: { x: 0, y: 487, w: 82, h: 22 },
      replayButtonText: { x: 0, y: 511, w: 124, h: 22 },
      loadSavedButtonText: { x: 0, y: 535, w: 76, h: 42 },
      playArcadeButtonText: { x: 0, y: 579, w: 116, h: 42 },
      playCustomButtonText: { x: 0, y: 623, w: 116, h: 42 },
      chooseMapButtonText: { x: 0, y: 667, w: 116, h: 42 },
      /// MENU GRAPHICS ///
      title: { x: 764, y: 62, w: 193, h: 53 },
      wonGraphic: { x: 308, y: 296, w: 58, h: 75 },
      lostGraphic: { x: 368, y: 296, w: 71, h: 71 },
      crashGraphic: { x: 519, y: 296, w: 75, h: 35 },
      pausedGraphic: { x: 441, y: 296, w: 75, h: 75 },
      endGraphic: { x: 596, y: 296, w: 75, h: 75 },
      shine: { x: 462, y: 450, w: 75, h: 75 },
      badShine: { x: 539, y: 450, w: 75, h: 75 },
    };
  }

  getSprite(spriteName: string): ISprite | null {
    let regSprite = this.spriteData[spriteName];
    let terrainSprite = this.terrainSpriteData[spriteName];
    if (regSprite) return regSprite;
    if (terrainSprite) return this.getCurrentTerrainSprite(spriteName);
    return null;
  }

  getCurrentTerrainSprite(name: string) {
    let { terrainStyle } = this._game;
    let s = { ...this.terrainSpriteData[name], y: this._terrainRows[terrainStyle] };
    return s;
  }

  getPlayerCarSprite() {
      return this.spriteData[`${this._game.carColor}Car`];
  }

  getBossCarSprite() {
      return this.spriteData.redCar;
  }
}

export default SpriteMap;