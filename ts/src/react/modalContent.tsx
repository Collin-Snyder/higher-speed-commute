import React, { useEffect, useState } from "react";
import LoadMapContent from "./loadMapContent";
import SaveMapContent from "./saveMapContent";
import ResetMapContent from "./resetMapContent";
import LevelStartContent from "./levelStartContent";

interface ModalContentProps {
  modalName: string;
}

export interface MapProperties {
  id: number;
  name: string;
  [key: string]: any;
}

const ModalContent = ({ modalName }: ModalContentProps) => {
  return (
    <>
      <div
        id="modal-content"
        className={
          modalName === "save" || modalName === "levelStart" ? "" : "border"
        }
      >
        {modalName === "loadMap" ? (
          <LoadMapContent />
        ) : (
          <></>
        )}
        {modalName === "save" ? <SaveMapContent /> : <></>}
        {modalName === "reset" ? <ResetMapContent /> : <></>}
        {modalName === "levelStart" ? (
          <LevelStartContent />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ModalContent;
