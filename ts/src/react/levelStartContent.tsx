import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";

const LevelStartContent = () => {
  let [, dispatch] = useContext(ModalInputContext);
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: function(e: PointerEvent) {
        //@ts-ignore
        let buttonId = e.target?.id;
        let difficulty = buttonId.match(/(?<=play)(.+)(?=-)/)[0].toLowerCase();
        window.game.setDifficulty(difficulty);
        console.log("Chosen difficulty: ", difficulty);
        window.game.publish("startingAnimation");
      },
    });
  }, []);

  return (
    <div id="level-start-content">
      <h3>Select playing difficulty to start</h3>
    </div>
  );
};

export default LevelStartContent;
