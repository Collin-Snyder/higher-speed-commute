export {};
//@ts-ignore
// import express from "express";
const express = require("express");
//@ts-ignore
const db = require("./db");
//@ts-ignore
const MapHelpers = require("./mapHelpers");
//@ts-ignore
const fs = require("fs");
//@ts-ignore
const levelDescriptors = require("./levelDescriptors");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static("build"));

//@ts-ignore
app.set("port", process.env.PORT || 3000);

//@ts-ignore
app.get("/levels/:levelNum", async (req, res) => {
  try {
    let next = await db.query(
      "SELECT level_id FROM next_levels WHERE level_number = $1",
      [req.params.levelNum]
    );
    if (next.rows[0] === undefined) {
      console.log(next.rows[0]);
      res.send("end of game");
    } else {
      let data = await db.query(
        "SELECT l.*, n.next_level_id, n.level_number FROM levels l JOIN next_levels n ON l.id = n.level_id WHERE n.level_number = $1",
        [req.params.levelNum]
      );
      let {
        id,
        next_level_id,
        level_number,
        level_name,
        board_height,
        board_width,
        player_home,
        boss_home,
        office,
        squares,
        lights,
        coffees,
      } = data.rows[0];

      let levelInfo = {
        id,
        level_number,
        level_name,
        next_level_id,
        map_info: {
          board_height,
          board_width,
          player_home,
          boss_home,
          office,
          squares,
          lights,
          coffees,
        },
      };
      res.send(levelInfo);
    }
  } catch (err) {
    console.log("Error in GET levels/:levelNum handler");
    console.error(err);
    res.send(err);
  }
});

//@ts-ignore
app.get("/maps/:id", (req, res) => {
  db.query("SELECT * FROM levels WHERE id = $1", [req.params.id])
    .then((data: any) => {
      let mapInfo = data.rows[0];
      res.send(mapInfo);
    })
    .catch((err: any) => {
      console.log(err);
      res.send(
        `You asked for id ${req.params.id} but there was an error: ${err}`
      );
    });
});

//@ts-ignore
app.post("/maps", async (req, res) => {
  // console.log("Req body: ", req.body);
  let {
    user_id,
    level_name,
    board_height,
    board_width,
    player_home,
    boss_home,
    office,
    squares,
    lights,
    coffees,
  } = req.body;
  try {
    let returned = await db.query(
      "INSERT INTO levels (level_name, board_height, board_width, player_home, boss_home, office, squares, lights, coffees) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [
        level_name,
        board_height,
        board_width,
        player_home,
        boss_home,
        office,
        squares,
        lights,
        coffees,
      ]
    );
    res.send(returned.rows[0]);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

//@ts-ignore
app.put("/maps/:id", async (req, res) => {
  let { id } = req.params;
  let { player_home, boss_home, office, squares, lights, coffees } = req.body;
  try {
    await db.query(
      "UPDATE levels SET player_home = $1, boss_home = $2, office = $3, squares = $4, lights = $5, coffees = $6 WHERE id = $7",
      [player_home, boss_home, office, squares, lights, coffees, id]
    );
    res.send(`Successfully updated level ${id}`);
  } catch (err) {
    res.send(`${err.name}: ${err.message}`);
  }
});

//@ts-ignore
app.post("/races", async (req, res) => {
  try {
    let {
      levelId,
      outcome,
      difficulty,
      raceTime,
      raceDate,
      playerColor,
      coffeesConsumed,
      coffeesConsumedCount,
      redLightsHit,
      redLightsHitCount,
      schoolZoneTime,
    } = req.body;
    let returned = await db.query(
      "INSERT INTO races (level_id, outcome, difficulty, race_time, race_date, player_color, coffees_consumed, coffees_consumed_count, red_lights_hit, red_lights_hit_count, time_in_schoolzone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
      [
        levelId,
        outcome,
        difficulty,
        raceTime,
        raceDate,
        playerColor,
        JSON.stringify(coffeesConsumed),
        coffeesConsumedCount,
        JSON.stringify(redLightsHit),
        redLightsHitCount,
        schoolZoneTime,
      ]
    );
    res.send(returned.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});
//@ts-ignore
app.post("/convert_legacy_levels", async (req, res) => {
  try {
    await db.query("BEGIN");
    await db.query("DROP TABLE IF EXISTS levels");
    await db.query(
      "CREATE TABLE levels (id SERIAL, user_id INT, level_name TEXT, board_height INT, board_width INT, player_home INT, boss_home INT, office INT, squares JSONB, lights JSONB, coffees JSONB)"
    );
    const legacy = await db.query("SELECT * FROM user_levels");
    for (let level of legacy.rows) {
      let { user_id, level_name } = level;
      let {
        height,
        width,
        playerHome,
        bossHome,
        office,
        lights,
        coffees,
        squares,
      } = MapHelpers.convertLegacyMapObject(level);
      let queryStr = `INSERT INTO levels (user_id, level_name, board_height, board_width, player_home, boss_home, office, squares, lights, coffees) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      let params = [
        user_id,
        level_name,
        height,
        width,
        playerHome,
        bossHome,
        office,
        JSON.stringify(squares),
        JSON.stringify(lights),
        JSON.stringify(coffees),
      ];
      await db.query(queryStr, params);
    }
    await db.query("COMMIT");
    res.send(`Successfully converted!`);
  } catch (err) {
    await db.query("ROLLBACK");
    res.send(`${err.name}: ${err.message}`);
  }
});

//@ts-ignore
app.post("/generate_seed_data", async (req, res) => {
  try {
    let levelData = await db.query(
      "SELECT * FROM levels WHERE id IN (SELECT level_id FROM next_levels) order by level_name"
    );
    let nextLevelData = await db.query("SELECT * FROM next_levels order by level_number");

    nextLevelData.rows.forEach((r: any, i: number) => {
      let level = levelData.rows[i];
      let ld = levelDescriptors[r.level_number];
      level.level_number = r.level_number;
      level.name = ld.name;
      level.description = ld.description;
    })

    let arcadeMaps = levelData.rows;
    fs.writeFile("ts/src/state/seedData.ts", `const seedData = '${JSON.stringify(arcadeMaps)}';\nexport default seedData;`, (err: any) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("File write successful!");
    });
    res.send(arcadeMaps);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

//@ts-ignore
app.get("/", (req, res) => {
  res.send();
});

app.listen(app.get("port"), () => {
  console.log(`Now listening on port ${app.get("port")}`);
});
