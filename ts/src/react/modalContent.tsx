import React from "react";
import OptionList, { ModalOptions } from "./optionList";

interface ModalContentProps {
  modalName: string;
  children: any;
}

const ModalContent = ({ modalName, children }: ModalContentProps) => {
  return (
    <>
      <div
        id="modal-content"
        className={
          modalName === "save" || modalName === "levelStart" ? "" : "border"
        }
      >
        {children}
      </div>
    </>
  );
};

export default ModalContent;
