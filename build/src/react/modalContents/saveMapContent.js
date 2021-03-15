import React, { useContext, useEffect, useState } from "react";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";
import TextInput from "../textInput";
const SaveMapContent = () => {
    const game = useGame();
    let [inputState, dispatch] = useContext(ModalInputContext);
    let [duplicateName, setDuplicateName] = useState(false);
    let [otherError, setOtherError] = useState(false);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                save: (name) => {
                    console.log("Saving map with name: ", name);
                    game.designModule
                        .saveAsAsync(name)
                        .then((r) => {
                        setDuplicateName(false);
                        setOtherError(false);
                        window.toggleModal(false);
                    })
                        .catch((err) => {
                        console.error(err);
                        if (err.name === "ConstraintError")
                            setDuplicateName(true);
                        else
                            setOtherError(true);
                    });
                },
            },
        });
    }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement(TextInput, { submitAction: "save" }),
        duplicateName ? React.createElement("p", { className: "warning" }, "There is already a map with that name. Please choose a unique name.") : React.createElement(React.Fragment, null),
        otherError && !duplicateName ? React.createElement("p", { className: "warning" }, "Something went wrong. Your map was not saved.") : React.createElement(React.Fragment, null)));
};
export default SaveMapContent;
