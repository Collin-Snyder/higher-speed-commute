import React, { useState, useEffect } from "react";
//@ts-ignore
import axios from "axios";
import Modal from "./modal";
import ModalButtonContainer from "./modalButtons";
import ModalContent from "./modalContent";
import LoadMapContent from "./loadMapContent";

let toggleModal = (isOpen: boolean, modalName: string) => {
  console.log("! Original toggleModal is running !");
};

export interface MapProperties {
  id: number;
  name: string;
  [key: string]: any;
}
const ModalContainer = () => {
  let [modalOpen, setModalOpen] = useState(false);
  let [modalName, setModalName] = useState("");
  let [levelNum, setLevelNum] = useState(0);
  let [userMaps, setUserMaps] = useState<MapProperties[]>([]);
  let [levelExtras, setLevelExtras] = useState({});

  useEffect(() => {
    if (modalName === "loadMap") {
      let maps = [
        { id: 1, name: "This is a long label" },
        { id: 2, name: "Short" },
        { id: 3, name: "Short label" },
        { id: 4, name: "My awesome level" },
        { id: 5, name: "LEVEL" },
        { id: 6, name: "Wow I made a level" },
        { id: 7, name: "ABCDEFGHIJKLMNOP" },
      ];
      setUserMaps(maps);
    } else if (modalName === "levelStart") {
      let extras = {
        img: null,
        quote: "Not all who wander are late",
      };
      setLevelExtras(extras);
    }
  }, [modalName]);

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
            <ModalContent modalName={modalName}>
              {modalName === "loadMap" ? (
                <LoadMapContent userMaps={userMaps} />
              ) : (
                <></>
              )}
            </ModalContent>
            <ModalButtonContainer
              modalName={modalName}
              toggleModal={setModalOpen}
            />
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
