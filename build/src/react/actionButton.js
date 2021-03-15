import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./contexts/modalInputContext";
import { checkForMouseCollision } from "gameMath";
const ActionButton = ({ buttonName, toggleModal, buttonAction, buttonType, }) => {
    const [inputState, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        return () => {
            dispatch({ type: "SET_INPUT_VALUE", payload: "" });
            dispatch({ type: "SET_SUBMIT_ACTIONS", payload: {} });
        };
    }, []);
    return (React.createElement("i", { className: `action-button ${buttonType} ${buttonName}`, id: `${buttonName}-button`, onPointerDown: (e) => {
            //@ts-ignore
            e.target.setPointerCapture(e.pointerId);
        }, onPointerUp: (e) => {
            //@ts-ignore
            e.target.releasePointerCapture(e.pointerId);
            let mx = e.clientX;
            let my = e.clientY;
            //@ts-ignore
            let { x, y, width, height } = e.target.getBoundingClientRect();
            let pointerOnButton = checkForMouseCollision(mx, my, x, y, width, height);
            if (pointerOnButton) {
                if (inputState.inputValue === "" && buttonType === "submit")
                    return;
                let input = inputState.inputValue === "useEvent" ? e : inputState.inputValue;
                console.log("about to run button action");
                buttonAction(input);
            }
        } }));
};
export default ActionButton;
