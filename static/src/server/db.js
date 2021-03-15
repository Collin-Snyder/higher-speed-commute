//@ts-ignore
const { Pool } = require("pg");
const pool = new Pool({
    user: "collinsnyder",
    host: "localhost",
    database: "high_speed_commute",
    port: 5432,
});
//@ts-ignore
module.exports = {
    query: (text, params) => pool.query(text, params),
};
