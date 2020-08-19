const tagGroups: { [group: string]: string[] } = {
  menu: ["menu", "main"],
};

let AllTags: Array<string> = [];

for (let group in tagGroups) {
  AllTags = AllTags.concat(tagGroups[group]);
}

export default AllTags;
