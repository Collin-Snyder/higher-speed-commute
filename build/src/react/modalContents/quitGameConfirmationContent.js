import React, { useContext, useEffect } from "react";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";
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
    const game = useGame();
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                save: () => {
                    game.publish("saveProgress");
                    game.publish("quit");
                    window.toggleModal(false);
                },
                dontSave: () => {
                    game.resetLastCompletedLevel();
                    game.publish("quit");
                    window.toggleModal(false);
                }
            },
        });
    }, []);
    return React.createElement(OptionList, { listName: "quitGame", options: options, optionsWillSubmit: true });
};
export default QuitGameConfirmationContent;
