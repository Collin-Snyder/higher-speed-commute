var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Dexie from "dexie";
import { SandboxMap } from "./map";
//@ts-ignore
import seedData from "./seedData.ts";
import { extraMinify, minify } from "./levelCompression";
export class LocalDB extends Dexie {
    constructor() {
        super("LocalDB");
        this.version(1).stores({
            userMaps: "++id, &name",
            arcadeMaps: "++id, &name, &levelNumber",
            mapTestData: "++id, levelId, outcome, difficulty, duration, date, coffeesConsumedCount, redLightsHitCount, timeInSchoolZone",
            userInfo: "id",
        });
        this.userMaps = this.table("userMaps");
        this.arcadeMaps = this.table("arcadeMaps");
        this.mapTestData = this.table("mapTestData");
        this.userInfo = this.table("userInfo");
    }
}
const db = new LocalDB();
db.on("populate", function () {
    return __awaiter(this, void 0, void 0, function* () {
        let arcadeMaps = JSON.parse(seedData).map(({ level_number, name, description, board_width, board_height, player_home, boss_home, office, squares, lights, coffees, }) => {
            return {
                name,
                description,
                levelNumber: level_number,
                boardWidth: board_width,
                boardHeight: board_height,
                playerHome: player_home,
                bossHome: boss_home,
                office,
                squares,
                lights,
                coffees,
            };
        });
        yield db.arcadeMaps.bulkAdd(arcadeMaps);
        console.log("Arcade levels seeded");
    });
});
db.userMaps.mapToClass(SandboxMap);
db.open().catch((err) => {
    console.error(`Open failed: ${err.stack}`);
});
export default db;
////////////////////////////
///// QUERY FUNCTIONS /////
///////////////////////////
export function loadArcadeLevel(levelNum) {
    return __awaiter(this, void 0, void 0, function* () {
        levelNum = Number(levelNum);
        let lastLevel = yield db.arcadeMaps
            .orderBy("levelNumber")
            .last(({ levelNumber }) => levelNumber);
        if (levelNum > lastLevel)
            return "end of game";
        let map = yield db.arcadeMaps
            .where("levelNumber")
            .equals(levelNum)
            .first();
        let { id, levelNumber, name, description, boardHeight, boardWidth, playerHome, bossHome, office, squares, lights, coffees, } = map;
        return {
            id,
            levelNumber,
            name,
            description,
            mapInfo: {
                boardHeight,
                boardWidth,
                playerHome,
                bossHome,
                office,
                squares,
                lights,
                coffees,
            },
        };
    });
}
export function loadCustomLevel(levelId) {
    return __awaiter(this, void 0, void 0, function* () {
        let level = yield db.userMaps.get(Number(levelId));
        if (!level)
            throw new Error(`There is no user level with id ${levelId}`);
        let { id, name, boardHeight, boardWidth, playerHome, bossHome, office, squares, lights, coffees, } = level;
        return {
            id,
            levelNumber: 0,
            name,
            description: "",
            mapInfo: {
                boardHeight,
                boardWidth,
                playerHome,
                bossHome,
                office,
                squares,
                lights,
                coffees,
            },
        };
    });
}
export function loadUserMap(levelId) {
    return __awaiter(this, void 0, void 0, function* () {
        let map = yield db.userMaps.get(levelId);
        let miniMap = minify(map);
        let extraMiniMap = extraMinify(map);
        // console.log("Regular map string length: ", JSON.stringify(map).length);
        // console.log("Mini map string length: ", miniMap.length);
        // console.log("Extra mini map string length: ", extraMiniMap.length);
        // console.log("Extra mini map: ", extraMiniMap);
        return map;
    });
}
export function loadAllUserMaps() {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userMaps.toArray();
    });
}
export function updateUserMap(mapData) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userMaps.put(mapData);
    });
}
export function saveNewUserMap(mapData) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userMaps.add(mapData);
    });
}
export function deleteUserMap(levelId) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userMaps.delete(Number(levelId));
    });
}
export function saveTestData(mapTestDataObj) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.mapTestData.add(mapTestDataObj);
    });
}
export function createUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield getUserInfo();
        if (!user) {
            yield db.userInfo.add({
                id: 1,
                color: "blue",
                lastCompletedLevel: 0,
                terrain: "default",
            });
            user = yield getUserInfo();
        }
        return user;
    });
}
export function getUserInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userInfo.get(1);
    });
}
export function loadCompletedLevels() {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield db.userInfo.get(1);
        let { lastCompletedLevel } = user;
        return db.arcadeMaps
            .where("levelNumber")
            .belowOrEqual(lastCompletedLevel)
            .toArray();
    });
}
export function updateLastCompletedLevel(levelNum) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userInfo.update(1, { lastCompletedLevel: levelNum });
    });
}
export function updateGraphicsSettings({ color, terrain, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return db.userInfo.update(1, { color, terrain });
    });
}
export function getLastCompletedLevel() {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield db.userInfo.get(1);
        return user.lastCompletedLevel;
    });
}
/////////////////////////////////
///// DEV HELPER FUNCTIONS /////
////////////////////////////////
window.showAll = function (tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //@ts-ignore
            let records = yield db[tableName].toArray();
            if (!records || !records.length)
                console.log(`Table "${tableName}" is empty`);
            else
                console.table(records);
        }
        catch (err) {
            console.error(err);
        }
    });
};
window.updateLevelName = function (levelId, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield db.arcadeMaps.update(levelId, { name: newName });
            console.log(`${result} record successfully updated`);
        }
        catch (err) {
            console.error(err);
        }
    });
};
window.updateLevelDescription = function (levelId, newDesc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield db.arcadeMaps.update(levelId, { description: newDesc });
            console.log(`${result} record successfully updated`);
        }
        catch (err) {
            console.error(err);
        }
    });
};
window.deleteUserMap = function (map) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result;
            if (typeof map == "string") {
                result = yield db.userMaps
                    .where("name")
                    .equals(map)
                    .delete();
                console.log(`${result} map successfully deleted`);
            }
            else if (typeof map == "number") {
                result = yield db.userMaps
                    .where("id")
                    .equals(map)
                    .delete();
                console.log(`${result} map successfully deleted`);
            }
        }
        catch (err) {
            console.error(err);
        }
    });
};
window.recreateLocalDb = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            db.close();
            yield db.delete();
            window.location.reload();
        }
        catch (err) {
            console.error(err);
        }
    });
};
