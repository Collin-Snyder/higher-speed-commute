import React, { useEffect, useContext } from "react";
import { ModalInputContext } from "../contexts/modalInputContext";
const RulesHelpContent = () => {
    let [, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({ type: "SET_SUBMIT_ACTIONS", payload: {
                next: () => {
                    window.toggleModal(true, "controlsHelp");
                }
            } });
        dispatch({ type: "SET_INPUT_VALUE", payload: "useEvent" });
    }, []);
    return React.createElement("i", { id: "rules-help-graphic", className: "help-graphic" });
};
export default RulesHelpContent;
