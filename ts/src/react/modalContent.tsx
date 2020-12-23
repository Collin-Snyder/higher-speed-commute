import React from "react";
import OptionList, { ModalOptions } from "./optionList";

interface ModalContentProps {
  modalName: string;
}

const options: { [key: string]: ModalOptions[] } = {
  loadMap: [
    { value: 1, label: "My Level 1" },
    { value: 2, label: "My Level 2" },
    { value: 3, label: "My Level 3" },
    { value: 4, label: "My Level 4" },
    { value: 5, label: "My Level 5" },
  ],
};

const ModalContent = ({ modalName }: ModalContentProps) => {
  let optionList = options[modalName];
  return (
    <div id="modal-content">
      {optionList ? (
        <OptionList listName={modalName} options={optionList} />
      ) : (
        <></>
      )}
    </div>
  );
};

export default ModalContent;
