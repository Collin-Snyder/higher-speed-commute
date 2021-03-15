import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";
import OptionList from "./optionList";
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
            type: "SET_SUBMIT_FUNC",
            payload: (choice) => {
                if (choice === "continue")
                    window.game.publish("start", window.game.lastCompletedLevel + 1);
                if (choice === "playCompleted") {
                    window.toggleModal(true, "loadMap");
                }
            },
        });
    }, []);
    return React.createElement(OptionList, { listName: "reset", options: options });
};
export default ArcadeStartContent;
