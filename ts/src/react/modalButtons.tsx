import React, { useContext } from "react";
import ActionButton from "./actionButton";
import { ModalInputContext } from "./modalInputContext";

interface ModalButtonContainerProps {
  modalName: string;
  toggleModal: Function;
}

interface ModalButton {
  type: string;
  name: string;
  action?: Function;
}

const noOp = function() {};

const modalButtons: { [key: string]: ModalButton[] } = {
  save: [
    { type: "cancel", name: "cancel" },
    {
      type: "submit",
      name: "save",
    },
  ],
  loadMap: [
    { type: "cancel", name: "cancel" },
    {
      type: "submit",
      name: "load",
    },
  ],
  reset: [
    { type: "cancel", name: "cancel" },
    {
      type: "submit",
      name: "reset",
    },
  ],
  levelStart: [
    { type: "submit", name: "playEasy" },
    { type: "submit", name: "playMedium" },
    { type: "submit", name: "playHard" },
  ],
};

const ModalButtonContainer = ({
  modalName,
  toggleModal,
}: ModalButtonContainerProps) => {
  let [inputState] = useContext(ModalInputContext);

  let buttons = modalButtons[modalName] || [];

  return (
    <div id="modal-button-container">
      {buttons.map(({ type, name }: ModalButton) => {
        let action = noOp;
        if (type === "submit") action = inputState.submitInput;
        return (
          <ActionButton
            buttonName={name}
            toggleModal={toggleModal}
            buttonAction={action}
            key={name}
          />
        );
      })}
    </div>
  );
};

export default ModalButtonContainer;
