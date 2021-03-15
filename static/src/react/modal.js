import React from "react";
import { generateModalTitles } from "gameHelpers";
import { useGame } from "./contexts/gameContext";
const Modal = ({ children, name, levelNum }) => {
    const game = useGame();
    let { title, subtitle } = generateModalTitles(name, game.currentLevel, game.playMode);
    let warning = name === "reset";
    return (React.createElement("div", { id: "modal", className: name, onClick: (e) => e.stopPropagation() },
        title ? React.createElement("h1", { className: "modal-title" }, title) : React.createElement(React.Fragment, null),
        subtitle ? React.createElement("p", { className: `modal-subtitle ${warning ? `warning` : ``}` }, subtitle) : React.createElement(React.Fragment, null),
        children));
};
export default Modal;
