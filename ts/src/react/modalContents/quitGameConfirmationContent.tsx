import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";
import OptionList from "../optionList";

const options = [
  { value: "save", label: "Save your progress" },
  {
    value: "dontSave",
    label: "Don't save",
  },
];

const QuitGameConfirmationContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        save: () => {
          window.game.publish("saveProgress"); 
          window.game.publish("quit");
          window.toggleModal(false);
        },
        dontSave: () => {
          window.game.resetLastCompletedLevel();
          window.game.publish("quit");
          window.toggleModal(false);
        }
      },
    });
  }, []);
  return <OptionList listName="quitGame" options={options} optionsWillSubmit={true} />;
};

export default QuitGameConfirmationContent;
