import React, { useContext } from "react";
import { ModalInputContext } from "./contexts/modalInputContext";
import SelectionButton from "./selectionButton";
import SettingsOption from "./settingsOption";
const OptionList = ({ listName, options, optionsWillSubmit, }) => {
    let [inputState, dispatch] = useContext(ModalInputContext);
    let { toggleModal } = window;
    let isSettingsMenu = /Settings/.test(listName);
    //@ts-ignore;
    let settingsMenu = listName.match(/(\w+)(?=Settings)/) ? listName.match(/(\w+)(?=Settings)/)[0] : "";
    let cssClass = listName === "loadMap" ? "columns" : isSettingsMenu ? "horizontal" : "";
    let handleChange = (e) => { };
    if (optionsWillSubmit) {
        handleChange = (e) => {
            inputState.submitActions[e.target.value]();
        };
    }
    else if (isSettingsMenu) {
        handleChange = (e) => {
            dispatch({
                type: "SET_INPUT_VALUE",
                payload: Object.assign(Object.assign({}, inputState.inputValue), { [settingsMenu]: e.target.value }),
            });
        };
    }
    else {
        handleChange = (e) => {
            dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
        };
    }
    let optionButtons = isSettingsMenu
        ? options.map(({ value, label, sprite }) => (React.createElement(SettingsOption, { name: listName, 
            //@ts-ignore
            value: value, label: label, sprite: sprite, selected: inputState.inputValue[settingsMenu] == value, handleChange: handleChange, key: value })))
        : options.map(({ value, label }) => (React.createElement(SelectionButton, { name: listName, value: value, label: label, selected: inputState.inputValue == value, willSubmit: optionsWillSubmit, handleChange: handleChange, key: value })));
    return (React.createElement("div", { id: "modal-options", className: cssClass, onKeyPress: (e) => {
            if (e.key === "Enter" && inputState.inputValue) {
                let input = inputState.inputValue === "" ? e : inputState.inputValue;
                inputState.submitInput(input);
                toggleModal(false);
                dispatch({ type: "SET_INPUT_VALUE", payload: "" });
            }
        } }, optionButtons));
};
export default OptionList;
