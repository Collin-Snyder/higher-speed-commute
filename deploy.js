const ghpages = require("gh-pages");

const dir = "build";
const options = {
  dest: "high-speed-commute/static",
  repo: "https://github.com/Collin-Snyder/Collin-Snyder.github.io.git",
  message: `Auto-generated commit - ${new Date().toDateString()}`,
};

ghpages.publish(dir, options);
