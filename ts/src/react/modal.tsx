import React from "react";
import { generateModalTitles } from "../modules/gameHelpers";

interface ModalProps {
  children: any;
  name: string;
  levelNum: number;
}

const Modal = ({ children, name, levelNum }: ModalProps) => {
  let { title, subtitle } = generateModalTitles(name, levelNum);
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
