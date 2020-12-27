import React from "react";
import { generateModalTitle } from "../modules/gameHelpers";

interface ModalProps {
  children: any;
  name: string;
  levelNum: number;
}

const Modal = ({ children, name, levelNum }: ModalProps) => {
  let title = generateModalTitle(name, levelNum);
  return (
    <div id="modal" className={name} onClick={(e) => e.stopPropagation()}>
      {title ? <h1 className="modal-title">{title}</h1> : <></>}
      {children}
    </div>
  );
};

export default Modal;
