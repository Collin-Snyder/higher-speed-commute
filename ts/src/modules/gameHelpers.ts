export function capitalize(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

export function generateModalTitles(modalName: string, levelNum: number): {title: string, subtitle: string} {
  let output = {title: "", subtitle: ""};
  if (levelNum) {
    output.title = `Level ${levelNum}`;
  }
  else if (modalName === "loadMap") output.title = "Load Map";
  else if (modalName === "save") output.title = "Save Your Map";
  else if (modalName === "reset") {
    output.title = "Reset Map";
    output.subtitle = "This action cannot be undone";
  }
  return output;
}
