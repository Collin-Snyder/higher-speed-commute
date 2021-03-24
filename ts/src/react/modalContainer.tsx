import React, { useState, useCallback } from "react";
import { GameContextProvider } from "./contexts/gameContext";
import { ModalInputContextProvider } from "./contexts/modalInputContext";
import Modal from "./modal";
import ModalButtons from "./modalButtons";
import ModalContent from "./modalContent";

let toggleModal = (isOpen: boolean, modalName: string) => {
  console.error(new Error("! Original toggleModal is running !"));
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
    // console.log("Opening modal " + modalName)
    setModalName(modalName);
    if (levelNumber) setLevelNum(levelNumber);
    setModalOpen(isOpen);
  };

  let closeModalOnClickOutside = useCallback(
    (e) => {
      if (modalName !== "levelStart") setModalOpen(false);
    },
    [modalName]
  );

  return (
    <>
      {modalOpen ? (
        <div id="modal-container" onClick={closeModalOnClickOutside}>
          <GameContextProvider>
            <Modal name={modalName} levelNum={levelNum}>
              <ModalInputContextProvider>
                <ModalContent modalName={modalName} />
                <ModalButtons
                  modalName={modalName}
                />
              </ModalInputContextProvider>
            </Modal>
          </GameContextProvider>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export { toggleModal };

export default ModalContainer;
