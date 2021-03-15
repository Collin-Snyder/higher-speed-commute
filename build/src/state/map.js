var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { calculateSurroundingSquareCount, randomNumBtwn, } from "gameMath";
import { updateUserMap, saveNewUserMap } from "./localDb";
export class Square {
    constructor(id, row, column) {
        this.id = id;
        this.row = row;
        this.column = column;
        this.drivable = false;
        this.schoolZone = false;
        this.borders = { up: null, down: null, left: null, right: null };
        this.coordinates = { X: (column - 1) * 25, Y: (row - 1) * 25 };
        this.tileIndex = this.id - 1;
    }
}
export class ArcadeMap {
    constructor(boardWidth, boardHeight) {
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.squares = [];
        this.squareCount = boardWidth * boardHeight;
        this.playerHome = 0;
        this.bossHome = 0;
        this.office = 0;
        this.lights = {};
        this.coffees = {};
        this.name = "";
        this.id = 0;
        this.generateSquares();
        this.getSquare = this.getSquare.bind(this);
        this.setSquare = this.setSquare.bind(this);
        this.addBorders = this.addBorders.bind(this);
    }
    static fromMapObject(mapObj) {
        const { id, name, boardWidth, boardHeight, squares, playerHome, bossHome, office, lights, coffees, } = mapObj;
        const newMap = new this(boardWidth, boardHeight);
        newMap.id = id;
        newMap.name = name;
        newMap.playerHome = playerHome;
        newMap.bossHome = bossHome;
        newMap.office = office;
        newMap.lights = lights;
        newMap.coffees = coffees;
        for (let i = 0; i < squares.length; i++) {
            newMap.squares[i].drivable = squares[i].drivable;
            newMap.squares[i].schoolZone = squares[i].schoolZone;
        }
        return newMap;
    }
    static fromMiniMapObject(miniMapObj) {
        let { h, w, p, b, o, l, c, s } = miniMapObj;
        let coffees = {};
        c.forEach((id) => (coffees[id] = true));
        const newMap = new this(w, h);
        newMap.playerHome = p;
        newMap.bossHome = b;
        newMap.office = o;
        newMap.lights = l;
        newMap.coffees = coffees;
        s.forEach((s) => {
            let { i, d, z } = s;
            let id = Number(i);
            newMap.setSquare(id, "drivable", !!d);
            newMap.setSquare(id, "schoolZone", !!z);
        });
        return newMap;
    }
    get width() {
        return this.boardWidth;
    }
    get height() {
        return this.boardHeight;
    }
    get pixelWidth() {
        return this.width * 25;
    }
    get pixelHeight() {
        return this.height * 25;
    }
    generateSquares() {
        for (let s = 1; s <= this.squareCount; s++) {
            this.squares.push(new Square(s, Math.ceil(s / this.width), Math.floor(s % this.width) > 0
                ? Math.floor(s % this.width)
                : this.width));
        }
        this.squares.forEach((square) => {
            this.addBorders(square);
        });
    }
    addBorders(square) {
        const id = square.id;
        if ((id - 1) % this.width !== 0)
            square.borders.left = this.squares[id - 2];
        if (id % this.width !== 0)
            square.borders.right = this.squares[id];
        if (id - this.width > 0)
            square.borders.up = this.squares[id - this.width - 1];
        if (id + this.width <= this.squareCount)
            square.borders.down = this.squares[id + this.width - 1];
        return square;
    }
    getSquare(s) {
        if (!this.squares[s - 1]) {
            console.log("Invalid square id");
            return null;
        }
        //@ts-ignore
        return this.squares[s - 1];
    }
    setSquare(s, key, val) {
        if (!this.squares[s - 1]) {
            console.log("Invalid square id");
            return undefined;
        }
        this.squares[s - 1][key] = val;
        return this.squares[s - 1];
    }
    generateTileMap(isRefMap = false) {
        return this.squares.map((s) => {
            var _a;
            let type = "";
            if (s.drivable) {
                if (s.schoolZone && !isRefMap)
                    type = "schoolZone";
                else if (this.playerHome === s.id)
                    type = "playerHome";
                else if (this.bossHome === s.id)
                    type = "bossHome";
                else if (this.office === s.id)
                    type = "office";
                else
                    type = "street";
            }
            else if (!isRefMap) {
                if (Math.random() < 0.4) {
                    // @ts-ignore
                    if (Math.random() <= 0.07)
                        type = "tree1";
                    // @ts-ignore
                    else
                        type = "tree" + Math.round(Math.random() + 2);
                }
                else if (Math.random() < 0.3 &&
                    typeof s.borders.down != "number" && ((_a = s.borders.down) === null || _a === void 0 ? void 0 : _a.drivable)) {
                    type = "house";
                }
                else if (Math.random() < 0.7) {
                    //@ts-ignore
                    if (Math.random() < 0.8)
                        type = "smallObj" + Math.round(Math.random() * 3 + 1);
                    //@ts-ignore
                    else
                        type = "medObj" + Math.round(Math.random() + 1);
                }
                // else {
                //   // @ts-ignore
                //   type = "grass" + Math.round(Math.random() * 7 + 1);
                // }
            }
            return {
                id: s.id,
                type,
                a: 1,
                h: 25,
                w: 25,
                row: s.row,
                col: s.column,
                deg: 0,
                display: true,
            };
        });
    }
    generateReferenceTileMap() {
        return this.squares.map((s) => {
            if (this.playerHome === s.id)
                return "playerHome";
            if (this.bossHome === s.id)
                return "bossHome";
            if (this.office === s.id)
                return "office";
            if (s.drivable)
                return "street";
            return "";
        });
    }
    getSquareByCoords(X, Y) {
        X = Math.floor(X / 25) * 25;
        Y = Math.floor(Y / 25) * 25;
        let row = Y / 25;
        let col = X / 25 + 1;
        let id = row * 40 + col;
        if (row > 25 || col > 40)
            return null;
        return this.getSquare(id);
    }
    getSurroundingSquares(x, y, layers) {
        let startSquare = (this.getSquareByCoords(x < 0 ? 0 : x, y < 0 ? 0 : y));
        let queue = new PathQueue();
        let visited = {};
        let toInclude = [];
        let sqCount = calculateSurroundingSquareCount(layers);
        let count = 0;
        queue.put(startSquare);
        visited[startSquare.id] = true;
        toInclude.push(startSquare);
        while (!queue.empty() && count < sqCount) {
            let currentId = queue.get();
            let currentSquare = this.getSquare(currentId);
            toInclude.push(currentSquare);
            for (let direction in currentSquare.borders) {
                let next = currentSquare.borders[direction];
                if (next && !visited.hasOwnProperty(next.id)) {
                    queue.put(next);
                    visited[next.id] = true;
                }
            }
            count++;
        }
        return toInclude;
    }
    getAttributesByCoords(X, Y, attributes) {
        let square = this.getSquareByCoords(X, Y);
        let attrVals = {};
        if (!square) {
            console.log("Invalid coordinates - no valid square at this location.");
            return null;
        }
        for (let attribute of attributes) {
            if (!square.hasOwnProperty(attribute)) {
                console.log("Invalid attribute name. Accessible attributes are: ", ...Object.keys(square));
                continue;
            }
            //@ts-ignore
            attrVals[attribute] = square[attribute];
        }
        if (Object.keys(attrVals).length === 0)
            return null;
        //@ts-ignore
        return square[attribute];
    }
    getKeySquare(k) {
        return this.getSquare(this[k]);
    }
    hasAllKeySquares() {
        return this.playerHome && this.bossHome && this.office;
    }
    findPath(startX, startY, endX, endY) {
        let startSquare = this.getSquareByCoords(startX, startY);
        let endSquare = this.getSquareByCoords(endX, endY);
        let frontier = new PathQueue();
        let cameFrom = {};
        let pathStack = [];
        let foundTarget = false;
        //start the queue with the starting square (start)
        frontier.put(startSquare);
        //assign start's "cameFrom" property to null
        cameFrom[startSquare.id] = null;
        //run a loop to expand the frontier in every direction on each iteration and break if end is reached
        while (frontier.empty() === false) {
            let currentId = frontier.get();
            let currentSquare = this.squares[currentId - 1];
            if (currentId == endSquare.id) {
                foundTarget = true;
                break;
            }
            for (let direction in currentSquare.borders) {
                let next = currentSquare.borders[direction];
                if (next && next.drivable && !cameFrom.hasOwnProperty(next.id)) {
                    frontier.put(next);
                    cameFrom[next.id] = currentId;
                }
            }
        }
        if (!foundTarget) {
            console.log(`No valid path from square ${startSquare.id} to square ${endSquare.id}`);
            return [[0, 0]];
        }
        let current = endSquare;
        //loop backwards through the path taken to reach the end and add to stack
        while (current.id !== startSquare.id) {
            let { X, Y } = current.coordinates;
            pathStack.push([X, Y]);
            // current.bossPath = true;
            current = this.getSquare(cameFrom[current.id]);
        }
        pathStack.push([startX, startY]);
        return pathStack;
    }
}
class PathQueue {
    constructor() {
        this.front = 0;
        this.end = -1;
        this.storage = {};
        this.size = 0;
    }
    put(square) {
        this.end++;
        this.size++;
        this.storage[this.end] = square.id;
    }
    get() {
        if (this.empty())
            return null;
        let oldFront = this.front;
        let output = this.storage[oldFront];
        this.front++;
        delete this.storage[oldFront];
        this.size--;
        return output;
    }
    empty() {
        return this.front > this.end;
    }
}
export class SandboxMap extends ArcadeMap {
    static fromUserMapObject(mapObj) {
        console.log(mapObj);
        let { boardWidth, boardHeight, playerHome, bossHome } = mapObj;
        let converted = Object.assign(Object.assign({}, mapObj), { board_width: boardWidth, board_height: boardHeight, player_home: playerHome, boss_home: bossHome });
        return SandboxMap.fromMapObject(converted);
    }
    constructor(width, height) {
        super(width, height);
    }
    generateDesignTileMap() {
        return this.squares.map((s) => {
            return {
                type: this.determineTileValue(s.id),
                a: 1,
                w: 25,
                h: 25,
                deg: 0,
                xoffset: 0,
                yoffset: 0,
                display: true,
            };
        });
    }
    tileIndex(id) {
        return id - 1;
    }
    isKeySquare(id) {
        return this.playerHome == id || this.bossHome == id || this.office == id;
    }
    determineTileValue(id) {
        let square = this.getSquare(id);
        if (square.drivable) {
            if (this.playerHome === square.id)
                return "playerHome";
            if (this.bossHome === square.id)
                return "bossHome";
            if (this.office === square.id)
                return "office";
            let tiles = [];
            if (square.schoolZone)
                tiles.push("schoolZone");
            else
                tiles.push("street");
            if (this.lights.hasOwnProperty(square.id))
                tiles.push("greenLight");
            else if (this.coffees.hasOwnProperty(square.id))
                tiles.push("coffee");
            return tiles.length > 1 ? tiles : tiles[0];
        }
        return "";
    }
    handleKeySquareAction(editor, square, drawing, tool) {
        console.log(`Adding ${tool}!`);
        let id = square.id;
        let keySquareId = this[tool];
        let tileChanges = [];
        let isKeySquare = keySquareId === square.id;
        let keySquareExists = keySquareId > 0;
        if (isKeySquare) {
            editor.execute("makeNotDrivable", id);
            editor.execute("removeKeySquare", tool, id);
        }
        else {
            if (keySquareExists) {
                tileChanges.push(keySquareId);
                editor.execute("makeNotDrivable", keySquareId);
                editor.execute("removeKeySquare", tool, keySquareId);
            }
            if (!square.drivable)
                editor.execute("makeDrivable", id);
            if (square.schoolZone)
                editor.execute("makeNotSchoolZone", id);
            editor.execute("makeKeySquare", tool, id);
        }
        tileChanges.push(id);
        return tileChanges;
    }
    handleStreetAction(editor, square, drawing) {
        let id = square.id;
        let tileChanges = [];
        let isPlayerHome = this.playerHome === id;
        let isBossHome = this.bossHome === id;
        let isOffice = this.office === id;
        let hasLight = this.lights.hasOwnProperty(id);
        let hasCoffee = this.coffees.hasOwnProperty(id);
        if (isPlayerHome) {
            editor.execute("removeKeySquare", "playerHome", id);
            editor.execute("makeNotDrivable", id);
        }
        if (isBossHome) {
            editor.execute("removeKeySquare", "bossHome", id);
            editor.execute("makeNotDrivable", id);
        }
        if (isOffice) {
            editor.execute("removeKeySquare", "office", id);
            editor.execute("makeNotDrivable", id);
        }
        if (hasLight) {
            editor.execute("removeLight", id);
        }
        if (hasCoffee) {
            editor.execute("removeCoffee", id);
        }
        if (square.drivable && square.schoolZone) {
            editor.execute("makeNotSchoolZone", id);
        }
        else if (square.drivable && !drawing) {
            editor.execute("makeNotDrivable", id);
        }
        else if (!square.drivable) {
            editor.execute("makeDrivable", id);
        }
        tileChanges.push(id);
        return tileChanges;
    }
    handleSchoolZoneAction(editor, square, drawing) {
        let id = square.id;
        let tileChanges = [];
        let isKeySquare = this.isKeySquare(id);
        if (square.drivable && square.schoolZone && !drawing) {
            editor.execute("makeNotSchoolZone", id);
            editor.execute("makeNotDrivable", id);
        }
        else if (square.drivable && !square.schoolZone && !isKeySquare) {
            editor.execute("makeSchoolZone", id);
        }
        else if (!square.drivable && !square.schoolZone) {
            editor.execute("makeDrivable", id);
            editor.execute("makeSchoolZone", id);
        }
        tileChanges.push(id);
        return tileChanges;
    }
    handleLightAction(editor, square) {
        let id = square.id;
        let tileChanges = [];
        let hasLight = this.lights.hasOwnProperty(id);
        let hasCoffee = this.coffees.hasOwnProperty(id);
        let isKeySquare = this.isKeySquare(id);
        if (hasLight) {
            editor.execute("removeLight", id);
        }
        else {
            if (hasCoffee) {
                editor.execute("removeCoffee", id);
            }
            if (!isKeySquare && square.drivable) {
                editor.execute("addLight", id, randomNumBtwn(4, 12) * 1000);
            }
        }
        tileChanges.push(id);
        return tileChanges;
    }
    handleCoffeeAction(editor, square) {
        let id = square.id;
        let tileChanges = [];
        let hasLight = this.lights.hasOwnProperty(id);
        let hasCoffee = this.coffees.hasOwnProperty(id);
        let isKeySquare = this.isKeySquare(id);
        if (hasCoffee) {
            editor.execute("removeCoffee", id);
        }
        else {
            if (hasLight) {
                editor.execute("removeLight", id);
            }
            if (!isKeySquare && square.drivable) {
                editor.execute("addCoffee", id);
            }
        }
        tileChanges.push(id);
        return tileChanges;
    }
    handleEraserAction(editor, square) {
        let id = square.id;
        let tileChanges = [];
        let isPlayerHome = this.playerHome === id;
        let isBossHome = this.bossHome === id;
        let isOffice = this.office === id;
        let hasLight = this.lights.hasOwnProperty(id);
        let hasCoffee = this.coffees.hasOwnProperty(id);
        if (isPlayerHome)
            editor.execute("removeKeySquare", "playerHome", id);
        else if (isBossHome)
            editor.execute("removeKeySquare", "bossHome", id);
        else if (isOffice)
            editor.execute("removeKeySquare", "office", id);
        if (square.schoolZone)
            editor.execute("makeNotSchoolZone", id);
        if (square.drivable)
            editor.execute("makeNotDrivable", id);
        if (hasLight)
            editor.execute("removeLight", id);
        if (hasCoffee)
            editor.execute("removeCoffee", id);
        tileChanges.push(id);
        return tileChanges;
    }
    compressSquares() {
        let compressed = this.squares.map((square) => {
            square = Object.assign({}, square);
            square.borders = Object.assign({}, square.borders);
            for (let direction in square.borders) {
                let dir = direction;
                if (square.borders[dir] !== null) {
                    //@ts-ignore
                    let borderId = square.borders[dir].id;
                    //@ts-ignore
                    square.borders[dir] = borderId;
                }
                if (square.borders[dir] === undefined) {
                    console.log("Found undefined border data for square ", square.id, " during compression");
                    debugger;
                }
            }
            return square;
        });
        return compressed;
    }
    exportForSave() {
        const save = {
            board_height: this.height,
            board_width: this.width,
            player_home: this.playerHome,
            boss_home: this.bossHome,
            office: this.office,
            squares: JSON.stringify(this.compressSquares()),
            lights: JSON.stringify(this.lights),
            coffees: JSON.stringify(this.coffees),
        };
        return save;
    }
    exportForLocalSaveAs() {
        const save = {
            boardHeight: this.height,
            boardWidth: this.width,
            playerHome: this.playerHome,
            bossHome: this.bossHome,
            office: this.office,
            squares: this.compressSquares(),
            lights: this.lights,
            coffees: this.coffees,
            name: this.name,
        };
        return save;
    }
    exportMapObject() {
        const mapObj = {
            boardHeight: this.height,
            boardWidth: this.width,
            playerHome: this.playerHome,
            bossHome: this.bossHome,
            office: this.office,
            squares: this.squares,
            lights: this.lights,
            coffees: this.coffees,
            name: this.name ? this.name : "Untitled map",
            id: this.id
        };
        return mapObj;
    }
    saveMapAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.id)
                throw new Error("You are trying to use saveMapAsync to save a map that does not already have an associated id. Please use saveNewMapAsync instead");
            let updatedMap = this.exportForLocalSaveAs();
            updatedMap.id = this.id;
            console.log("Current map with id ", this.id, " is being updated");
            return updateUserMap(updatedMap);
        });
    }
    saveNewMapAsync(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.name = name;
            let newSandboxMap = this.exportForLocalSaveAs();
            let newId = yield saveNewUserMap(newSandboxMap);
            this.id = newId;
            console.log(`This map is now called ${this.name} and was saved under id ${this.id}`);
        });
    }
    compress() {
        let compressedSq = this.squares.map((square) => {
            square = Object.assign({}, square);
            square.borders = Object.assign({}, square.borders);
            for (let direction in square.borders) {
                let dir = direction;
                if (square.borders[dir] !== null) {
                    //@ts-ignore
                    let borderId = square.borders[dir].id;
                    //@ts-ignore
                    square.borders[dir] = borderId;
                }
            }
            return square;
        });
        this.squares = compressedSq;
        return this;
    }
    decompress() {
        let decompressed = this.squares.map((square) => {
            square = Object.assign({}, square);
            square.borders = Object.assign({}, square.borders);
            for (let direction in square.borders) {
                let dir = direction;
                let borderId = square.borders[dir];
                if (borderId !== null) {
                    //@ts-ignore
                    square.borders[dir] = this.squares[borderId - 1];
                }
                if (square.borders[dir] === undefined) {
                    console.log("Found undefined border data for square ", square.id, " during decompress");
                    debugger;
                }
            }
            return square;
        });
        this.squares = decompressed;
        return this;
    }
    clear(editor) {
        editor.execute("removeKeySquare", "playerHome");
        editor.execute("removeKeySquare", "bossHome");
        editor.execute("removeKeySquare", "office");
        for (let square of this.squares) {
            let id = square.id;
            editor.execute("makeNotSchoolZone", id);
            editor.execute("makeNotDrivable", id);
            editor.execute("removeLight", id);
            editor.execute("removeCoffee", id);
        }
    }
}
// export default ArcadeMap;
