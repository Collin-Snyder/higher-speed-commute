import React from "react";
import { generateModalTitle } from "../modules/gameHelpers";

interface ModalProps {
  children: any;
  name: string;
}

const Modal = ({ children, name }: ModalProps) => {
  let title = generateModalTitle(name);
  return (
    <div id="modal" className={name} onClick={(e) => e.stopPropagation()}>
      {title ? <h1>{title}</h1> : <></>}
      {children}
    </div>
  );
};

export default Modal;
