import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../contexts/modalInputContext";
import OptionList from "../optionList";
import { useGame } from "../contexts/gameContext";
const options = [
    { value: "continue", label: "Continue where you left off" },
    {
        value: "playCompleted",
        label: "Play a completed level",
    },
];
const ArcadeStartContent = () => {
    let [, dispatch] = useContext(ModalInputContext);
    const game = useGame();
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                continue: () => {
                    window.toggleModal(false);
                    game.publish("start", game.lastCompletedLevel + 1);
                },
                playCompleted: () => {
                    window.toggleModal(true, "loadMap");
                },
            },
        });
    }, []);
    return (React.createElement(OptionList, { listName: "reset", options: options, optionsWillSubmit: true }));
};
export default ArcadeStartContent;
