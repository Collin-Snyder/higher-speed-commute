import React from "react";
import OptionList from "./optionList";

const options = [
  { value: "save", label: "Save current map and start new map" },
  {
    value: "overwrite",
    label: "Discard and overwrite current map (this cannot be undone)",
  },
];

const ResetMapContent = () => {
  return <OptionList listName="reset" options={options} />;
};

export default ResetMapContent;
