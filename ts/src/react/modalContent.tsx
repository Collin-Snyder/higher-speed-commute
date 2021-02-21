import React, { useEffect, useState } from "react";
import LoadMapContent from "./modalContents/loadMapContent";
import SaveMapContent from "./modalContents/saveMapContent";
import ResetMapContent from "./modalContents/resetMapContent";
import LevelStartContent from "./modalContents/levelStartContent";
import ArcadeStartContent from "./modalContents/arcadeStartContent";
import QuitGameConfirmationContent from "./modalContents/quitGameConfirmationContent";
import QuitDesignConfirmationContent from "./modalContents/quitDesignConfirmationContent";
import MissingKeySquaresContent from "./modalContents/missingKeySquaresContent";
import SettingsContent from "./modalContents/settingsContent";

interface ModalContentProps {
  modalName: string;
}

export interface MapProperties {
  id: number;
  name: string;
  [key: string]: any;
}

const ModalContent = ({ modalName }: ModalContentProps) => {
  console.log("Rendering modal content for modal: ", modalName);

  let Content;
  let cssClass = "border";

  switch (modalName) {
    case "save":
      Content = SaveMapContent;
      cssClass = "";
      break;
    case "levelStart":
      Content = LevelStartContent;
      cssClass = "";
      break;
    case "missingKeySquares":
      Content = MissingKeySquaresContent;
      cssClass = "";
      break;
    case "settings":
      Content = SettingsContent;
      cssClass = "";
      break;
    case "loadMap":
      Content = LoadMapContent;
      break;
    case "arcadeStart":
      Content = ArcadeStartContent;
      break;
    case "reset":
      Content = ResetMapContent;
      break;
    case "quitGameConfirmation":
      Content = QuitGameConfirmationContent;
      break;
    case "quitDesignConfirmation":
      Content = QuitDesignConfirmationContent;
      break;
    
    default:
      Content = () => <></>;
  }

  return (
    <>
      <div id="modal-content" className={cssClass}>
        <Content />
      </div>
    </>
  );
};

export default ModalContent;
