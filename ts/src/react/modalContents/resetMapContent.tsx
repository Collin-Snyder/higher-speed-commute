import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";
import OptionList from "../optionList";

const options = [
  { value: "save", label: "Save current map" },
  {
    value: "overwrite",
    label: "Discard current map",
  },
];

const ResetMapContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        save: () => {
          window.game.designModule.resetMap("save");
          window.toggleModal(false);
        },
        overwrite: () => {
          window.game.designModule.resetMap("overwrite");
          window.toggleModal(false);
        },
      },
    });
  }, []);
  return (
    <OptionList listName="reset" options={options} optionsWillSubmit={true} />
  );
};

export default ResetMapContent;
