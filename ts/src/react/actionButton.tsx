import React, { useState } from "react";

interface ActionButtonProps {
  buttonName: string;
  buttonAction: Function;
}

const buttonImages: { [key: string]: any } = {
  playEasy: { x: 0, y: 50, w: 200, h: 75 },
  playEasyDepressed: { x: 0, y: 650, w: 200, h: 75 },
  playMedium: { x: 0, y: 0, w: 200, h: 75 },
  playMediumDepressed: { x: 0, y: 0, w: 200, h: 75 },
  playHard: { x: 0, y: 0, w: 200, h: 75 },
  playHardDepressed: { x: 0, y: 0, w: 200, h: 75 },
  cancel: { x: 0, y: 0, w: 200, h: 75 },
  cancelDepressed: { x: 0, y: 0, w: 200, h: 75 },
  load: { x: 0, y: 0, w: 200, h: 75 },
  loadDepressed: { x: 0, y: 0, w: 200, h: 75 },
  reset: { x: 0, y: 0, w: 200, h: 75 },
  resetDepressed: { x: 0, y: 0, w: 200, h: 75 },
  save: { x: 0, y: 200, w: 150, h: 75 },
  saveDepressed: { x: 0, y: 425, w: 150, h: 75 },
};

const ActionButton = ({ buttonName, buttonAction }: ActionButtonProps) => {
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
        buttonAction();
        //handle modal action depending on button name
      }}
    ></i>
  );
};

export default ActionButton;
