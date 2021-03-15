import React, { useEffect, useContext } from "react";
import { ModalInputContext } from "../contexts/modalInputContext";
const ControlsHelpContent = () => {
    let [, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({ type: "SET_SUBMIT_ACTIONS", payload: {
                next: () => {
                    window.toggleModal(true, "saveHelp");
                },
                back: () => {
                    window.toggleModal(true, "rulesHelp");
                }
            } });
        dispatch({ type: "SET_INPUT_VALUE", payload: "useEvent" });
    }, []);
    return React.createElement("i", { id: "controls-help-graphic", className: "help-graphic" });
};
export default ControlsHelpContent;
