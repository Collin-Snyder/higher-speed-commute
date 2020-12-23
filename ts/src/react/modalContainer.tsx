import React, { useState } from "react";
import Modal from "./modal";
import ModalButtonContainer from "./modalButtons";
import ModalContent from "./modalContent";
import ActionButton from "./actionButton";

let toggleModal = (isOpen: boolean, modalName: string) => {
  console.log("! Original toggleModal is running !");
};

const ModalContainer = () => {
  let [modalOpen, setModalOpen] = useState(false);
  let [modalName, setModalName] = useState("");

  window.toggleModal = (isOpen: boolean, modalName: string) => {
    setModalOpen(isOpen);
    setModalName(modalName);
    console.log("toggleModal is running");
  };

  return (
    <>
      {modalOpen ? (
        <div
          id="modal-container"
          onClick={(e) => {
            setModalOpen(false);
          }}
        >
          <Modal name={modalName}>
            <ModalContent modalName={modalName} />
            <ModalButtonContainer>
              <ActionButton
                buttonName="playEasy"
                buttonAction={() => {
                  setModalOpen(false);
                  console.log("I chose Easy!");
                }}
              />
              <ActionButton
                buttonName="playMedium"
                buttonAction={() => {
                  setModalOpen(false);
                  console.log("I chose Medium!");
                }}
              />
              <ActionButton
                buttonName="playHard"
                buttonAction={() => {
                  setModalOpen(false);
                  console.log("I chose Hard!");
                }}
              />
            </ModalButtonContainer>
          </Modal>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export { toggleModal };

export default ModalContainer;
