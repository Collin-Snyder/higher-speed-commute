import Dexie from "dexie";
import { ArcadeMap, SandboxMap } from "./state/map";
//@ts-ignore
import seedData from "./staticData/seedData";
import { extraMinify, minify } from "./state/levelCompression";

export class LocalDB extends Dexie {
  userMaps: Dexie.Table<SandboxMap>;
  arcadeMaps: Dexie.Table<any>;
  mapTestData: Dexie.Table<any>;
  userInfo: Dexie.Table<any>;

  constructor() {
    super("LocalDB");

    this.version(1).stores({
      userMaps: "++id, &name",
      arcadeMaps: "++id, &name, &levelNumber",
      mapTestData:
        "++id, levelId, outcome, difficulty, duration, date, coffeesConsumedCount, redLightsHitCount, timeInSchoolZone",
      userInfo: "id",
    });

    this.userMaps = this.table("userMaps");
    this.arcadeMaps = this.table("arcadeMaps");
    this.mapTestData = this.table("mapTestData");
    this.userInfo = this.table("userInfo");
  }
}

const db = new LocalDB();

db.on("populate", async function() {
  let arcadeMaps = JSON.parse(seedData).map(
    ({
      level_number,
      name,
      description,
      board_width,
      board_height,
      player_home,
      boss_home,
      office,
      squares,
      lights,
      coffees,
    }: any) => {
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
    }
  );

  await db.arcadeMaps.bulkAdd(arcadeMaps);
  console.log("Arcade levels seeded");
});

db.userMaps.mapToClass(SandboxMap);

db.open().catch((err) => {
  console.error(new Error(`Open failed: ${err.stack}`));
});

export default db;

////////////////////////////
///// QUERY FUNCTIONS /////
///////////////////////////

export async function loadArcadeLevel(levelNum: number) {
  levelNum = Number(levelNum);
  let lastLevel = await db.arcadeMaps
    .orderBy("levelNumber")
    .last(({ levelNumber }) => levelNumber);

  if (levelNum > lastLevel) return "end of game";

  let map = await db.arcadeMaps
    .where("levelNumber")
    .equals(levelNum)
    .first();

  let {
    id,
    levelNumber,
    name,
    description,
    boardHeight,
    boardWidth,
    playerHome,
    bossHome,
    office,
    squares,
    lights,
    coffees,
  } = map;

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
}

export async function loadCustomLevel(levelId: number) {
  let level = await db.userMaps.get(Number(levelId));

  if (!level) throw new Error(`There is no user level with id ${levelId}`);

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
  } = level;

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
}

export async function loadUserMap(levelId: number) {
  let map = await db.userMaps.get(levelId);
  let miniMap = minify(map);
  let extraMiniMap = extraMinify(map);
  // console.log("Regular map string length: ", JSON.stringify(map).length);
  // console.log("Mini map string length: ", miniMap.length);
  // console.log("Extra mini map string length: ", extraMiniMap.length);
  // console.log("Extra mini map: ", extraMiniMap);
  return map;
}

export async function loadAllUserMaps() {
  return db.userMaps.toArray();
}

export async function updateUserMap(mapData: any) {
  return db.userMaps.put(mapData);
}

export async function saveNewUserMap(mapData: any) {
  return db.userMaps.add(mapData);
}

export async function deleteUserMap(levelId: number) {
  return db.userMaps.delete(Number(levelId));
}

export async function saveTestData(mapTestDataObj: any) {
  return db.mapTestData.add(mapTestDataObj);
}

export async function getOrCreateUser() {
  let user = await getUserInfo();
  if (!user) {
    await db.userInfo.add({
      id: 1,
      color: "blue",
      lastCompletedLevel: 0,
      terrain: "default",
      hasCompletedGame: false,
    });
    user = await getUserInfo();
  }
  return user;
}

export async function getUserInfo() {
  return db.userInfo.get(1);
}

export async function loadCompletedLevels() {
  let user = await db.userInfo.get(1);
  let { lastCompletedLevel, hasCompletedGame } = user;

  if (hasCompletedGame) {
    return db.arcadeMaps.toArray();
  }

  return db.arcadeMaps
    .where("levelNumber")
    .belowOrEqual(lastCompletedLevel)
    .toArray();
}

export async function updateLastCompletedLevel(levelNum: number) {
  return db.userInfo.update(1, { lastCompletedLevel: levelNum });
}

export async function userHasCompletedGame() {
  return db.userInfo.update(1, { hasCompletedGame: true });
}

export async function updateGraphicsSettings({
  color,
  terrain,
}: { [key in "color" | "terrain"]: TCarColor | TTerrainStyle }) {
  return db.userInfo.update(1, { color, terrain });
}

export async function getLastCompletedLevel() {
  let user = await db.userInfo.get(1);
  return user.lastCompletedLevel;
}

/////////////////////////////////
///// DEV HELPER FUNCTIONS /////
////////////////////////////////

// window.updateLevelName = async function(levelId: number, newName: string) {
//   try {
//     let result = await db.arcadeMaps.update(levelId, { name: newName });
//     console.log(`${result} record successfully updated`);
//   } catch (err) {
//     console.error(err);
//   }
// };

// window.updateLevelDescription = async function(
//   levelId: number,
//   newDesc: string
// ) {
//   try {
//     let result = await db.arcadeMaps.update(levelId, { description: newDesc });
//     console.log(`${result} record successfully updated`);
//   } catch (err) {
//     console.error(err);
//   }
// };

// window.deleteUserMap = async function(map: number | string) {
//   try {
//     let result;
//     if (typeof map == "string") {
//       result = await db.userMaps
//         .where("name")
//         .equals(map)
//         .delete();
//       console.log(`${result} map successfully deleted`);
//     } else if (typeof map == "number") {
//       result = await db.userMaps
//         .where("id")
//         .equals(map)
//         .delete();
//       console.log(`${result} map successfully deleted`);
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };

// window.recreateLocalDb = async function() {
//   try {
//     db.close();
//     await db.delete();
//     window.location.reload();
//   } catch (err) {
//     console.error(err);
//   }
// };
