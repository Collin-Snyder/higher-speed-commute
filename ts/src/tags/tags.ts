const tagGroups: { [group: string]: string[] } = {
  menu: [
    "menu",
    "main",
    "gameplay",
    "design",
    "toolbar",
    "admin",
    "config",
    "paused",
    "won",
    "lost",
    "crash",
    "arcade",
    "custom",
    "completed",
    "testing",
    "end",
  ],
  animation: ["anim", "bg"],
  rendering: ["tileSized", "square"]
};

let AllTags: Array<string> = [];

for (let group in tagGroups) {
  AllTags = AllTags.concat(tagGroups[group]);
}

export default AllTags;
