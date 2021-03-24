function objMap(
  obj: { [key: string]: any },
  keyFunc?: ((key: string) => string) | null,
  valFunc?: ((val: any) => any) | null
) {
  let output = <{ [key: string]: any }>{};
  if (!keyFunc) keyFunc = (key: string) => key;
  if (!valFunc) valFunc = (val: any) => val;
  for (let key in obj) {
    output[keyFunc(key)] = valFunc(obj[key]);
  }
  return output;
}

function isNormalSquare(s: any) {
  let { drivable, schoolZone } = s;
  if (drivable || schoolZone) return false;
  return true;
}

export function minify(levelData: any) {
  let {
    id,
    name,
    boardHeight,
    boardWidth,
    playerHome,
    bossHome,
    office,
    squares,
    lights,
    coffees,
  } = levelData;
  let miniCoffees = Object.keys(coffees).map(id => Number(id));
  let miniSquares = squares.map((s: any) => {
    let {
      id,
      row,
      column,
      drivable,
      schoolZone,
      tileIndex,
      coordinates,
      borders,
    } = s;
    let miniBorders = objMap(
      borders,
      (b: string) => {
        switch (b) {
          case "up":
            return "u";
          case "down":
            return "d";
          case "left":
            return "l";
          case "right":
            return "r";
          default:
            return b;
        }
      },
      (s: number | null) => (s === null ? 0 : s)
    );
    let miniS = {
      i: id,
      r: row,
      c: column,
      d: drivable ? 1 : 0,
      z: schoolZone ? 1 : 0,
      t: tileIndex,
      xy: coordinates,
      b: miniBorders,
    };
    return miniS;
  });
  let mini = {
    i: id,
    n: name,
    h: boardHeight,
    w: boardWidth,
    p: playerHome,
    b: bossHome,
    o: office,
    l: lights,
    c: miniCoffees,
    s: miniSquares,
  };

  return JSON.stringify(mini);
}

export function extraMinify(levelData: any) {
  let {
    id,
    name,
    boardHeight,
    boardWidth,
    playerHome,
    bossHome,
    office,
    squares,
    lights,
    coffees,
  } = levelData;
  let miniCoffees = Object.keys(coffees).map(id => Number(id));
  let squareDiff = <Array<any>>[];

  squares.forEach((s: any) => {
    let normal = isNormalSquare(s);
    if (normal) return;
    let {
        id,
        drivable,
        schoolZone,
      } = s;
      let miniS = {
        i: id,
        d: drivable ? 1 : 0,
        z: schoolZone ? 1 : 0,
      };
      squareDiff.push(miniS);
  });

  let mini = {
    i: id,
    n: name,
    h: boardHeight,
    w: boardWidth,
    p: playerHome,
    b: bossHome,
    o: office,
    l: lights,
    c: miniCoffees,
    s: squareDiff,
  };
  return JSON.stringify(mini);
}

export function deMinify(levelStr: string) {

}
