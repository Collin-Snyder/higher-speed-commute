import React, { useEffect, useState } from "react";
import LoadMapContent from "./modalContents/loadMapContent";
import SaveMapContent from "./modalContents/saveMapContent";
import ResetMapContent from "./modalContents/resetMapContent";
import LevelStartContent from "./modalContents/levelStartContent";
import ArcadeStartContent from "./modalContents/arcadeStartContent";
import QuitGameConfirmationContent from "./modalContents/quitGameConfirmationContent";
import QuitDesignConfirmationContent from "./modalContents/quitDesignConfirmationContent";

interface ModalContentProps {
  modalName: string;
}

export interface MapProperties {
  id: number;
  name: string;
  [key: string]: any;
}

const ModalContent = ({ modalName }: ModalContentProps) => {
  console.log("Rendering modal content for modal: ", modalName)
  return (
    <>
      <div
        id="modal-content"
        className={
          modalName === "save" || modalName === "levelStart" ? "" : "border"
        }
      >
        {modalName === "loadMap" ? <LoadMapContent /> : <></>}
        {modalName === "arcadeStart" ? <ArcadeStartContent /> : <></>}
        {modalName === "save" ? <SaveMapContent /> : <></>}
        {modalName === "reset" ? <ResetMapContent /> : <></>}
        {modalName === "levelStart" ? <LevelStartContent /> : <></>}
        {modalName === "quitGameConfirmation" ? <QuitGameConfirmationContent /> : <></>}
        {modalName === "quitDesignConfirmation" ? <QuitDesignConfirmationContent /> : <></>}
      </div>
    </>
  );
};

export default ModalContent;
