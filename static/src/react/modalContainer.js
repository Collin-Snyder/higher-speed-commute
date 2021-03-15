import React, { useState, useCallback } from "react";
import Modal from "./modal";
import ModalButtons from "./modalButtons";
import ModalContent from "./modalContent";
import { ModalInputContextProvider } from "./contexts/modalInputContext";
import { GameContextProvider } from "./contexts/gameContext";
let toggleModal = (isOpen, modalName) => {
    console.log("! Original toggleModal is running !");
};
const ModalContainer = () => {
    let [modalOpen, setModalOpen] = useState(false);
    let [modalName, setModalName] = useState("");
    let [levelNum, setLevelNum] = useState(0);
    window.toggleModal = (isOpen, modalName, levelNumber) => {
        console.log("Opening modal " + modalName);
        setModalName(modalName);
        if (levelNumber)
            setLevelNum(levelNumber);
        setModalOpen(isOpen);
    };
    let closeModalOnClickOutside = useCallback((e) => {
        if (modalName !== "levelStart")
            setModalOpen(false);
    }, [modalName]);
    return (React.createElement(React.Fragment, null, modalOpen ? (React.createElement("div", { id: "modal-container", onClick: closeModalOnClickOutside },
        React.createElement(GameContextProvider, null,
            React.createElement(Modal, { name: modalName, levelNum: levelNum },
                React.createElement(ModalInputContextProvider, null,
                    React.createElement(ModalContent, { modalName: modalName }),
                    React.createElement(ModalButtons, { modalName: modalName, toggleModal: setModalOpen })))))) : (React.createElement(React.Fragment, null))));
};
export { toggleModal };
export default ModalContainer;
