import React, { useState, useContext, PointerEvent, MouseEvent } from "react";
import { ModalInputContext } from "./modalInputContext";
import { checkForMouseCollision } from "../modules/gameMath";

interface ActionButtonProps {
  buttonName: string;
  buttonType: string;
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
  go: { x: 500, y: 500, w: 150, h: 60 },
  goDepressed: { x: 650, y: 500, w: 150, h: 60 },
  ok: { x: 500, y: 560, w: 150, h: 60 },
  okDepressed: { x: 650, y: 560, w: 150, h: 60 },
  delete: {x: 500, y: 620, w: 150, h: 60},
  deleteDepressed: {x: 650, y: 620, w: 150, h: 60},
};

const ActionButton = ({
  buttonName,
  toggleModal,
  buttonAction,
  buttonType,
}: ActionButtonProps) => {
  const [inputState, dispatch] = useContext(ModalInputContext);
  const [depressed, setDepressed] = useState(false);
  const { x, y, w, h } = depressed
    ? buttonImages[`${buttonName}Depressed`]
    : buttonImages[buttonName];
  return (
    <i
      className={`action-button ${buttonType}`}
      id={`${buttonName}-button`}
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundPosition: `-${x}px -${y}px`,
      }}
      onPointerDown={(e: PointerEvent) => {
        //@ts-ignore
        e.target.setPointerCapture(e.pointerId);
        setDepressed(true);
      }}
      onPointerUp={(e: PointerEvent) => {
        //@ts-ignore
        e.target.releasePointerCapture(e.pointerId);
        setDepressed(false);

        let mx = e.clientX;
        let my = e.clientY;
        //@ts-ignore
        let { x, y, width, height } = e.target.getBoundingClientRect();
        let pointerOnButton = checkForMouseCollision(
          mx,
          my,
          x,
          y,
          width,
          height
        );

        if (pointerOnButton) {
          if ((inputState.inputValue === null || inputState.inputValue === "") && buttonType === "submit") return;
          let input =
            inputState.inputValue === "useEvent" ? e : inputState.inputValue;
          toggleModal(false);
          console.log("Input value: ", inputState.inputValue);
          buttonAction(input);
          dispatch({ type: "SET_INPUT_VALUE", payload: "" });
          dispatch({ type: "SET_SUBMIT_ACTIONS", payload: {} });
        }
      }}
    ></i>
  );
};

export default ActionButton;
