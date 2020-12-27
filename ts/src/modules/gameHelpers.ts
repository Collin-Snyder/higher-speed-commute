export function capitalize(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

export function generateModalTitle(modalName: string, levelNum: number): string {
  if (levelNum) {
    return `Level ${levelNum}`;
  }
  if (modalName === "loadMap") return "Load Map";
  if (modalName === "save") return "Save Your Map";
  if (modalName === "reset") return "Reset Map";
  return "";
}
