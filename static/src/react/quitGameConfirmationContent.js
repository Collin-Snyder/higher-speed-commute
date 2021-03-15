import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";
import OptionList from "./optionList";
const options = [
    { value: "save", label: "Save your progress" },
    {
        value: "dontSave",
        label: "Don't save",
    },
];
const QuitGameConfirmationContent = () => {
    let [inputState, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_FUNC",
            payload: (choice) => {
                if (choice === "save") {
                    window.game.publish("saveProgress");
                }
                window.game.publish("quit");
            },
        });
    }, []);
    return React.createElement(OptionList, { listName: "reset", options: options });
};
export default QuitGameConfirmationContent;
