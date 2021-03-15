import React, { useContext } from "react";
import { ModalInputContext } from "./contexts/modalInputContext";
const TextInput = ({ submitAction }) => {
    let [inputState, dispatch] = useContext(ModalInputContext);
    let { toggleModal } = window;
    let { submitActions, inputValue } = inputState;
    return (React.createElement("input", { id: "map-name-input", type: "text", onChange: (e) => {
            dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
        }, onKeyPress: (e) => {
            if (e.key === "Enter" && inputState.inputValue) {
                submitActions[submitAction](inputValue);
            }
        }, value: inputState.inputValue, placeholder: "Enter a unique name for your map" }));
};
export default TextInput;
