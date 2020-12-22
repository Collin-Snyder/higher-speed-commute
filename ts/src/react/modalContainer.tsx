import React, { useState } from "react";
import ActionButton from "./actionButton";

let toggleModal = (isOpen: boolean, modalName: string) => {
  console.log("! Original toggleModal is running !");
};

const ModalContainer = () => {
  let [modalOpen, setModalOpen] = useState(false);
  let [modalName, setModalName] = useState("");
  //@ts-ignore
  window.toggleModal = (isOpen: boolean, modalName: string) => {
    setModalOpen(isOpen);
    setModalName(modalName);
  };
  if (modalOpen) {
    return (
      <div id="modal-container">
        <h3>Now showing modal: {modalName}</h3>
        <ActionButton
          buttonName="save"
          buttonAction={() => {
            setModalOpen(false);
          }}
        />
        <ActionButton
          buttonName="playEasy"
          buttonAction={() => {
            setModalOpen(false);
          }}
        />
      </div>
    );
  } else {
    return <></>;
  }
};

export { toggleModal };

export default ModalContainer;
