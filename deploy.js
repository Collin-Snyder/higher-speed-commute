const ghpages = require("gh-pages");

const dir = "build";
const options = {
  dest: "high-speed-commute",
  repo: "https://github.com/Collin-Snyder/Collin-Snyder.github.io.git",
  message: `Auto-generated commit - ${new Date().toLocaleString()}`,
};

ghpages.publish(dir, options);
