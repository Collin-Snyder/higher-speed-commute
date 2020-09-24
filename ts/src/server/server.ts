export {};
//@ts-ignore
// import express from "express";
const express = require("express");
//@ts-ignore
const db = require("./db");
//@ts-ignore
const MapHelpers = require("./mapHelpers");

const app = express();
app.use(express.json({ limit: "50mb" }));

//@ts-ignore
app.set("port", process.env.PORT || 3000);

//@ts-ignore
app.get("/levels/:levelNum", (req, res) => {
  db.query(
    "SELECT l.*, n.next_level_id, n.level_number FROM levels l JOIN next_levels n ON l.id = n.level_id WHERE n.level_number = $1",
    [req.params.levelNum]
  )
    .then((data: any) => {
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
          coffees
        },
      };
      res.send(levelInfo);
    })
    .catch((err: any) => {
      console.error(err);
      res.send(
        `You asked for level number ${req.params.levelNum} but there was an error: ${err}`
      );
    });
});

//@ts-ignore
app.get("/map/:id", (req, res) => {
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
app.post("/map", async (req, res) => {
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
      "INSERT INTO levels (user_id, level_name, board_height, board_width, player_home, boss_home, office, squares, lights, coffees) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [
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
      ]
    );
    res.send(returned.rows[0]);
  } catch (err) {
    res.send(`${err.name}: ${err.message}`);
  }
});

//@ts-ignore
app.put("/map/:id", async (req, res) => {
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
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(app.get("port"), () => {
  console.log(`Now listening on port ${app.get("port")}`);
});
