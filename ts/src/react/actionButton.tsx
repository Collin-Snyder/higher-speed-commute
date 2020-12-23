import React, { useState } from "react";

interface ActionButtonProps {
  buttonName: string;
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
        // buttonAction();
      }}
      onClick={() => {
          buttonAction();
      }}
    ></i>
  );
};

export default ActionButton;
