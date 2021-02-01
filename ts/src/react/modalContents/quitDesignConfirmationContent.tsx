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
        ok: (choice: "save" | "dontSave") => {
          if (choice === "save") {
            window.game.designModule.quitting = true;
            window.game.publish("save");
          } else window.game.publish("quit");
        },
      },
    });
  }, []);
  return <OptionList listName="quitDesign" options={options} />;
};

export default QuitDesignConfirmationContent;
