export function capitalize(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

export function generateModalTitle(modalName: string): string {
  if (/level/.test(modalName)) {
    let levelNum = modalName.charAt(modalName.length - 1);
    return `Level ${levelNum}`;
  }
  if (modalName === "loadMap") return "Load Map";
  if (modalName === "save") return "Save Your Map";
  return "";
}
