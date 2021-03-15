import React, { useContext, useEffect } from "react";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";
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
    const game = useGame();
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                save: () => {
                    game.designModule.quitting = true;
                    window.toggleModal(false);
                    game.publish("save");
                },
                dontSave: () => {
                    game.publish("quit");
                    window.toggleModal(false);
                },
            },
        });
    }, []);
    return (React.createElement(OptionList, { listName: "quitDesign", options: options, optionsWillSubmit: true }));
};
export default QuitDesignConfirmationContent;
