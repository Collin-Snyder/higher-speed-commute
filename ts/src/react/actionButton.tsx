import React, { useState, useContext } from "react";
import { ModalInputContext } from "./modalInputContext";

interface ActionButtonProps {
  buttonName: string;
  toggleModal: Function;
  buttonAction: Function;
}

const buttonImages: { [key: string]: any } = {
  playEasy: { x: 200, y: 890, w: 200, h: 75 },
  playEasyDepressed: { x: 200, y: 890, w: 200, h: 75 },
  playMedium: { x: 200, y: 815, w: 200, h: 75 },
  playMediumDepressed: { x: 200, y: 815, w: 200, h: 75 },
  playHard: { x: 200, y: 740, w: 200, h: 75 },
  playHardDepressed: { x: 200, y: 740, w: 200, h: 75 },
  cancel: { x: 200, y: 680, w: 150, h: 60 },
  cancelDepressed: { x: 350, y: 680, w: 150, h: 60 },
  load: { x: 200, y: 500, w: 150, h: 60 },
  loadDepressed: { x: 350, y: 500, w: 150, h: 60 },
  reset: { x: 200, y: 620, w: 150, h: 60 },
  resetDepressed: { x: 350, y: 620, w: 150, h: 60 },
  save: { x: 200, y: 560, w: 150, h: 60 },
  saveDepressed: { x: 350, y: 560, w: 150, h: 60 },
};

const ActionButton = ({
  buttonName,
  toggleModal,
  buttonAction,
}: ActionButtonProps) => {
  const [inputState] = useContext(ModalInputContext);
  const [depressed, setDepressed] = useState(false);
  const { x, y, w, h } = depressed
    ? buttonImages[`${buttonName}Depressed`]
    : buttonImages[buttonName];
  return (
    <i
      className="action-button"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundPosition: `-${x}px -${y}px`,
      }}
      onMouseDown={() => {
        setDepressed(true);
      }}
      onMouseUp={() => {
        setDepressed(false);
      }}
      onClick={() => {
        console.log(`Running onClick action for '${buttonName}' button with input value ${inputState.inputValue}`)
        buttonAction(inputState.inputValue);
        toggleModal(false);
      }}
    ></i>
  );
};

export default ActionButton;
