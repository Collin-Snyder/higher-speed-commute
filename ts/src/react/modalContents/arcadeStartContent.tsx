import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../contexts/modalInputContext";
import OptionList from "../optionList";
import { useGame } from "../contexts/gameContext";

const ArcadeStartContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  const game = useGame();

  let options = [];

  if (game.hasCompletedGame && !game.lastCompletedLevel) {
    options.push({ value: "continue", label: "Play again from beginning" });
  } else {
    options.push({ value: "continue", label: "Continue where you left off" });
  }

  options.push({
    value: "playCompleted",
    label: "Play a completed level",
  });

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        continue: () => {
          window.toggleModal(false);
          game.publish("start", game.lastCompletedLevel + 1);
        },
        playCompleted: () => {
          game.playMode = "completed";
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
