//@ts-ignore
const express = require("express");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static("build"));

//@ts-ignore
app.set("port", process.env.PORT || 3000);

app.listen(app.get("port"), () => {
  console.log(`Now listening on port ${app.get("port")}`);
});
