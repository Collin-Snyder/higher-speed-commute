const { ceil, floor } = Math;

const convertLegacyMapObject = (legacyMapObj: any) => {
  let newMapObj = {
    width: legacyMapObj.board_width,
    height: legacyMapObj.board_height,
    playerHome: legacyMapObj.player_home,
    bossHome: legacyMapObj.boss_home,
    office: legacyMapObj.office,
    lights: legacyMapObj.stoplights,
    coffees: legacyMapObj.coffees,
    squares: convertLegacyMapSquares(legacyMapObj.layout),
  };
  return newMapObj;
};

const convertLegacyMapSquares = (legacyMapSquares: any) => {
  let formattedLayout = legacyMapSquares.map((s: any) => {
    let idNum = Number(s.id);
    let square: any = {
      id: s.id,
      row: ceil(idNum / 40),
      column: floor(idNum % 40) > 0 ? floor(idNum % 40) : 40,
    };
    square.borders = s.borders;
    square.drivable = s.type === "street";
    square.schoolZone = s.schoolZone;
    return square;
  });

  return formattedLayout;
};
//@ts-ignore
module.exports = {
  convertLegacyMapObject,
};
