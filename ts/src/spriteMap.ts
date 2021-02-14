const spriteMap = {
  /// TERRAIN TILES ///
  grass1: { x: 308, y: 124, w: 25, h: 25 },
  grass2: { x: 335, y: 124, w: 25, h: 25 },
  grass3: { x: 362, y: 124, w: 25, h: 25 },
  grass4: { x: 389, y: 124, w: 25, h: 25 },
  grass5: { x: 416, y: 124, w: 25, h: 25 },
  grass6: { x: 443, y: 124, w: 25, h: 25 },
  grass7: { x: 470, y: 124, w: 25, h: 25 },
  grass8: { x: 497, y: 124, w: 25, h: 25 },
  house: { x: 832, y: 124, w: 25, h: 25 },
  tree1: { x: 574, y: 124, w: 25, h: 25 },
  tree2: { x: 524, y: 124, w: 25, h: 25 },
  tree3: { x: 549, y: 124, w: 25, h: 25 },
  street: { x: 601, y: 124, w: 25, h: 25 },
  schoolZone: { x: 628, y: 124, w: 25, h: 25 },

  /// MAP TILES ///
  playerHome: { x: 655, y: 124, w: 25, h: 25 },
  bossHome: { x: 681, y: 124, w: 25, h: 25 },
  office: { x: 709, y: 124, w: 25, h: 25 },

  /// CARS ////
  blueCar: { x: 859, y: 124, w: 25, h: 25 },
  redCar: { x: 887, y: 124, w: 25, h: 25 },

  /// GAMEPLAY ENTITIES ///
  redLight: { x: 734, y: 124, w: 25, h: 25 },
  greenLight: { x: 780, y: 124, w: 25, h: 25 },
  yellowLight: { x: 757, y: 124, w: 25, h: 25 },
  coffee: { x: 805, y: 124, w: 25, h: 25 },
  countdown3: { x: 308, y: 527, w: 70, h: 71 },
  countdown2: { x: 380, y: 527, w: 70, h: 71 },
  countdown1: { x: 452, y: 527, w: 22, h: 71 },

  /// DESIGN ENTITIES ///
  designLight: { x: 913, y: 124, w: 25, h: 25 },

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

  /// UNUSED ///
  playArcadeButton: { x: 700, y: 0, w: 0, h: 0 },
  playCustomButton: { x: 500, y: 0, w: 0, h: 0 },
  designButton: { x: 0, y: 125, w: 0, h: 0 },
  saveButton: { x: 0, y: 200, w: 0, h: 0 },
  loadSavedButton: { x: 0, y: 275, w: 0, h: 0 },
  saveAsButton: { x: 0, y: 350, w: 0, h: 0 },
  homeButton: { x: 0, y: 425, w: 0, h: 0 },
  resumeButton: { x: 0, y: 500, w: 0, h: 0 },
  restartButton: { x: 0, y: 575, w: 0, h: 0 },
  quitButton: { x: 0, y: 650, w: 0, h: 0 },
  nextLevelButton: { x: 0, y: 725, w: 0, h: 0 },
  chooseMapButton: { x: 500, y: 75, w: 0, h: 0 },
  testButton: { x: 500, y: 150, w: 0, h: 0 },
  exportButton: { x: 500, y: 225, w: 0, h: 0 },
  wonGraphicTest: { x: 500, y: 300, w: 0, h: 0 },
  lostGraphicTest: { x: 575, y: 300, w: 0, h: 0 },
  crashGraphicTest: { x: 650, y: 300, w: 0, h: 0 },
};

export default spriteMap;
