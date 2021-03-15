import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";
import OptionList from "./optionList";
const options = [
    { value: "save", label: "Save current map" },
    {
        value: "overwrite",
        label: "Discard current map",
    },
];
const ResetMapContent = () => {
    let [inputState, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_FUNC",
            payload: (resetChoice) => {
                window.game.designModule.resetMap(resetChoice);
            },
        });
    }, []);
    return React.createElement(OptionList, { listName: "reset", options: options });
};
export default ResetMapContent;
