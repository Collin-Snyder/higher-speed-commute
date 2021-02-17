import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";
import OptionList from "../optionList";

const options = [
  { value: "save", label: "Save your changes" },
  {
    value: "dontSave",
    label: "Don't save",
  },
];

const QuitDesignConfirmationContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        save: () => {
          window.game.designModule.quitting = true;
          window.toggleModal(false);
          window.game.publish("save");
        },
        dontSave: () => {
          window.game.publish("quit");
          window.toggleModal(false);
        },
      },
    });
  }, []);
  return (
    <OptionList
      listName="quitDesign"
      options={options}
      optionsWillSubmit={true}
    />
  );
};

export default QuitDesignConfirmationContent;
