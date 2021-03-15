import React, { useContext, useEffect } from "react";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";
import OptionList from "../optionList";
const options = [
    { value: "save", label: "Save current map" },
    {
        value: "overwrite",
        label: "Discard current map",
    },
];
const ResetMapContent = () => {
    const game = useGame();
    let [, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                save: () => {
                    game.designModule.resetMap("save");
                    window.toggleModal(false);
                },
                overwrite: () => {
                    game.designModule.resetMap("overwrite");
                    window.toggleModal(false);
                },
            },
        });
    }, []);
    return (React.createElement(OptionList, { listName: "reset", options: options, optionsWillSubmit: true }));
};
export default ResetMapContent;
