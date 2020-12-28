import React, { useState, useEffect } from "react";
//@ts-ignore
import axios from "axios";
import Modal from "./modal";
import ModalButtons from "./modalButtons";
import ModalContent from "./modalContent";
import LoadMapContent from "./loadMapContent";
import { ModalInputContextProvider } from "./modalInputContext";

let toggleModal = (isOpen: boolean, modalName: string) => {
  console.log("! Original toggleModal is running !");
};

const ModalContainer = () => {
  let [modalOpen, setModalOpen] = useState(false);
  let [modalName, setModalName] = useState("");
  let [levelNum, setLevelNum] = useState(0);

  window.toggleModal = (
    isOpen: boolean,
    modalName: string,
    levelNumber?: number
  ) => {
    setModalOpen(isOpen);
    setModalName(modalName);
    if (levelNumber) setLevelNum(levelNumber);
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
          <Modal name={modalName} levelNum={levelNum}>
            <ModalInputContextProvider>
              <ModalContent modalName={modalName} />
              <ModalButtons modalName={modalName} toggleModal={setModalOpen} />
            </ModalInputContextProvider>
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
