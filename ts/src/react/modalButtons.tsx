import React from "react";
import ActionButton from "./actionButton";

interface ModalButtonContainerProps {
  modalName: string;
  toggleModal: Function;
}

interface ModalButton {
  name: string;
  action: Function;
}

const modalButtons: { [key: string]: ModalButton[] } = {
  save: [
    { name: "cancel", action: function() {} },
    { name: "save", action: function() {} },
  ],
  loadMap: [
    { name: "cancel", action: function() {} },
    { name: "load", action: function() {} },
  ],
  reset: [
    { name: "cancel", action: function() {} },
    { name: "reset", action: function() {} },
  ],
  levelStart: [
    { name: "playEasy", action: function() {} },
    { name: "playMedium", action: function() {} },
    { name: "playHard", action: function() {} },
  ],
};

const makeButtonAction = function(toggleModal: Function, callback: Function) {
  return function() {
    toggleModal(false);
    callback();
  };
};

const ModalButtonContainer = ({
  modalName,
  toggleModal,
}: ModalButtonContainerProps) => {
  let buttons = modalButtons[modalName] || [];
  return (
    <div id="modal-button-container">
      {buttons.map(({ name, action }: ModalButton) => (
        <ActionButton
          buttonName={name}
          buttonAction={makeButtonAction(toggleModal, action)}
          key={name}
        />
      ))}
    </div>
  );
};

export default ModalButtonContainer;
