const tagGroups = {
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
        "testing",
        "end",
    ],
    animation: ["anim", "bg"],
    rendering: ["tileSized", "square"]
};
let AllTags = [];
for (let group in tagGroups) {
    AllTags = AllTags.concat(tagGroups[group]);
}
export default AllTags;
