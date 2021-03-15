function objMap(obj, keyFunc, valFunc) {
    let output = {};
    if (!keyFunc)
        keyFunc = (key) => key;
    if (!valFunc)
        valFunc = (val) => val;
    for (let key in obj) {
        output[keyFunc(key)] = valFunc(obj[key]);
    }
    return output;
}
function isNormalSquare(s) {
    let { drivable, schoolZone } = s;
    if (drivable || schoolZone)
        return false;
    return true;
}
export function minify(levelData) {
    let { id, name, boardHeight, boardWidth, playerHome, bossHome, office, squares, lights, coffees, } = levelData;
    let miniCoffees = Object.keys(coffees).map(id => Number(id));
    let miniSquares = squares.map((s) => {
        let { id, row, column, drivable, schoolZone, tileIndex, coordinates, borders, } = s;
        let miniBorders = objMap(borders, (b) => {
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
        }, (s) => (s === null ? 0 : s));
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
export function extraMinify(levelData) {
    let { id, name, boardHeight, boardWidth, playerHome, bossHome, office, squares, lights, coffees, } = levelData;
    let miniCoffees = Object.keys(coffees).map(id => Number(id));
    let squareDiff = [];
    squares.forEach((s) => {
        let normal = isNormalSquare(s);
        if (normal)
            return;
        let { id, drivable, schoolZone, } = s;
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
export function deMinify(levelStr) {
}
