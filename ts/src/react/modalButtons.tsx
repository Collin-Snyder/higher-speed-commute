import React, { useContext } from "react";
import ActionButton from "./actionButton";
import { useGame } from "./contexts/gameContext";
import { ModalInputContext } from "./contexts/modalInputContext";

const noOp = function() {};

const modalButtons: { [key: string]: IModalButton[] } = {
  save: [
    { type: "cancel", name: "cancel" },
    {
      type: "submit",
      name: "save",
    },
  ],
  loadMap: [
    { type: "cancel", name: "cancel" },
    { type: "submit", name: "delete" },
    {
      type: "submit",
      name: "load",
    },
  ],
  levelStart: [
    { type: "submit", name: "playEasy" },
    { type: "submit", name: "playMedium" },
    { type: "submit", name: "playHard" },
  ],
  reset: [{ type: "cancel", name: "cancel" }],
  arcadeStart: [{ type: "cancel", name: "cancel" }],
  quitGameConfirmation: [{ type: "cancel", name: "cancel" }],
  quitDesignConfirmation: [{ type: "cancel", name: "cancel" }],
  missingKeySquares: [
    { type: "spacer", name: "spacer" },
    { type: "cancel", name: "ok" },
  ],
  settings: [
    { type: "cancel", name: "cancel" },
    { type: "submit", name: "save" },
  ],
  rulesHelp: [
    { type: "cancel", name: "done" },
    { type: "submit", name: "next" },
  ],
  controlsHelp: [
    { type: "cancel", name: "done" },
    { type: "submit", name: "back" },
    { type: "submit", name: "next" },
  ],
  saveHelp: [
    { type: "cancel", name: "done" },
    { type: "submit", name: "back" },
    { type: "spacer", name: "spacer"}
  ],
};

const ModalButtonContainer = ({
  modalName
}: IModalButtonContainerProps) => {
  const game = useGame();
  let [inputState] = useContext(ModalInputContext);

  let buttons = modalButtons[modalName] || [];

  if (modalName === "loadMap" && game.playMode)
    buttons = buttons.filter((b) => b.name !== "delete");

  return (
    <div id="modal-button-container">
      {buttons.map(({ type, name }: IModalButton) => {
        let action = noOp;
        if (type === "cancel")
          action = () => {
            window.toggleModal(false);
          };
        if (type === "submit")
          action = inputState.submitActions[name] || action;
        return (
          <ActionButton
            buttonName={name}
            buttonType={type}
            buttonAction={action}
            key={name}
          />
        );
      })}
    </div>
  );
};

export default ModalButtonContainer;
