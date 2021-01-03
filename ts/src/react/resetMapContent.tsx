import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";
import OptionList from "./optionList";

const options = [
  { value: "save", label: "Save current map" },
  {
    value: "overwrite",
    label: "Discard current map",
  },
];

const ResetMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: (resetChoice: "save" | "overwrite") => {
        window.game.designModule.resetMap(resetChoice);
      },
    });
  }, []);
  return <OptionList listName="reset" options={options} />;
};

export default ResetMapContent;
