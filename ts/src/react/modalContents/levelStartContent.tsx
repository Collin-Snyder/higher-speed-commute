import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";

const LevelStartContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        playEasy: (e: PointerEvent) => {
          window.game.setDifficulty("easy");
          window.game.publish("startingAnimation");
        },
        playMedium: (e: PointerEvent) => {
          window.game.setDifficulty("medium");
          window.game.publish("startingAnimation");
        },
        playHard: (e: PointerEvent) => {
          window.game.setDifficulty("hard");
          window.game.publish("startingAnimation");
        }
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
