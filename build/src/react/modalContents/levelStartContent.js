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
                playEasy: (e) => {
                    game.setDifficulty("easy");
                    window.toggleModal(false);
                    game.publish("startingAnimation");
                },
                playMedium: (e) => {
                    game.setDifficulty("medium");
                    window.toggleModal(false);
                    game.publish("startingAnimation");
                },
                playHard: (e) => {
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
    return (React.createElement("div", { id: "level-start-content" },
        React.createElement("i", { id: "level-start-graphic" }),
        React.createElement("h3", null, "Select playing difficulty to start")));
};
export default LevelStartContent;
