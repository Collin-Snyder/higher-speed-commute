import Dexie from "dexie";
import { ISquare, Direction } from "./map";
import { SandboxMap } from "../state/map";
//@ts-ignore
import seedData from "./seedData.json";

Dexie.delete("LocalDB");
export class LocalDB extends Dexie {
  userMaps: Dexie.Table<SandboxMap>;
  arcadeMaps: Dexie.Table<any>;
  nextLevels: Dexie.Table<any>;

  constructor() {
    super("LocalDB");

    this.version(1).stores({
      userMaps: "++id, &name",
      arcadeMaps: "++id, &name",
      nextLevels: "&levelId, &nextLevelId, &levelNumber",
    });

    this.userMaps = this.table("userMaps");
    this.arcadeMaps = this.table("arcadeMaps");
    this.nextLevels = this.table("nextLevels");
  }
}

interface IUserMap {
  id?: number;
  name: string;
  boardHeight: number;
  boardWidth: number;
}

const db = new LocalDB();

db.on("populate", async function() {
  let { arcadeMaps, nextLevels } = seedData;
  nextLevels = nextLevels.map((nl: any) => {
    return {
      levelId: nl.level_id,
      nextLevelId: nl.next_level_id,
      levelNumber: nl.level_number,
    };
  });

  arcadeMaps = arcadeMaps.map((am: any) => {
    return {
      name: am.level_name,
      boardWidth: am.board_width,
      boardHeight: am.board_height,
      playerHome: am.player_home,
      bossHome: am.boss_home,
      office: am.office,
      squares: am.squares,
      lights: am.lights,
      coffees: am.coffees,
    };
  });

  console.log("about to populate db");
  await db.arcadeMaps.bulkAdd(arcadeMaps);
  await db.nextLevels.bulkAdd(nextLevels);
  console.log("just populated db");
});

window.showAll = async function(tableName: string) {
  try {
    //@ts-ignore
    let records = await db[tableName].toArray();
    console.table(records);
  } catch (err) {
    console.error(err);
  }
};

window.deleteUserMap = async function(map: number | string) {
  try {
    let result;
    if (typeof map == "string") {
      result = await db.userMaps
        .where("name")
        .equals(map)
        .delete();
      console.log(`${result} map successfully deleted`);
    } else if (typeof map == "number") {
      result = await db.userMaps
        .where("id")
        .equals(map)
        .delete();
      console.log(`${result} map successfully deleted`);
    }
  } catch (err) {
    console.error(err);
  }
};

db.userMaps.mapToClass(SandboxMap);

export default db;
