import React from "react";
import { generateModalTitles } from "gameHelpers";
import { useGame } from "./contexts/gameContext";

const Modal = ({ children, name }: IModalProps) => {
  const game = useGame();
  let { title, subtitle } = generateModalTitles(name, game.currentLevel, game.playMode);
  let warning = name === "reset";

  return (
    <div id="modal" className={name} onClick={(e) => e.stopPropagation()}>
      {title ? <h1 className="modal-title">{title}</h1> : <></>}
      {subtitle ? <p className={`modal-subtitle ${warning ? `warning` : ``}`}>{subtitle}</p> : <></>}
      {children}
    </div>
  );
};

export default Modal;
