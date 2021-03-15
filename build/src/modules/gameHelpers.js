export function capitalize(word) {
    return word[0].toUpperCase() + word.slice(1);
}
export function generateModalTitles(modalName, levelNum) {
    let output = { title: "", subtitle: "" };
    if (modalName === "levelStart") {
        let { name, description } = window.game.currentLevel;
        output.title = name;
        output.subtitle = description;
    }
    else if (modalName === "loadMap")
        output.title = "Your Maps";
    else if (modalName === "save")
        output.title = "Save Your Map";
    else if (modalName === "reset") {
        output.title = "Reset Map";
        output.subtitle = "This action cannot be undone";
    }
    else if (modalName === "settings") {
        output.title = "Settings";
    }
    return output;
}
