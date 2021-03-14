import React, { useContext, useEffect } from "react";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";

const LevelStartContent = () => {
  const game = useGame();
  let [, dispatch] = useContext(ModalInputContext);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        playEasy: (e: PointerEvent) => {
          game.setDifficulty("easy");
          window.toggleModal(false);
          game.publish("startingAnimation");
        },
        playMedium: (e: PointerEvent) => {
          game.setDifficulty("medium");
          window.toggleModal(false);
          game.publish("startingAnimation");
        },
        playHard: (e: PointerEvent) => {
          game.setDifficulty("hard");
          window.toggleModal(false);
          game.publish("startingAnimation");
        },
      },
    });
    dispatch({
      type: "SET_INPUT_VALUE",
      payload: "useEvent",
    });
  }, []);

  return (
    <div id="level-start-content">
      <h3>Select playing difficulty to start</h3>
    </div>
  );
};

export default LevelStartContent;
