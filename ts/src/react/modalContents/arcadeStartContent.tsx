import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";
import OptionList from "../optionList";

const options = [
  { value: "continue", label: "Continue where you left off" },
  {
    value: "playCompleted",
    label: "Play a completed level",
  },
];

const ArcadeStartContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        continue: () => {
          window.toggleModal(false);
          window.game.publish("start", window.game.lastCompletedLevel + 1);
        },
        playCompleted: () => {
          window.toggleModal(true, "loadMap");
        },
      },
    });
  }, []);
  return (
    <OptionList listName="reset" options={options} optionsWillSubmit={true} />
  );
};

export default ArcadeStartContent;
