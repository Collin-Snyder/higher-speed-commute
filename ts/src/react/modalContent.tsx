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
  let [userMaps, setUserMaps] = useState<MapProperties[]>([]);
  let [levelExtras, setLevelExtras] = useState({});

  useEffect(() => {
    if (modalName === "loadMap") {
      let maps = [
        { id: 1, name: "This is a long label" },
        { id: 2, name: "Short" },
        { id: 3, name: "Short label" },
        { id: 4, name: "My awesome level" },
        { id: 5, name: "LEVEL" },
        { id: 6, name: "Wow I made a level" },
        { id: 7, name: "ABCDEFGHIJKLMNOP" },
      ];
      setUserMaps(maps);
    } else if (modalName === "levelStart") {
      let extras = {
        quote: "Not all who wander are late",
      };
      setLevelExtras(extras);
    }
  }, [modalName]);

  return (
    <>
      <div
        id="modal-content"
        className={
          modalName === "save" || modalName === "levelStart" ? "" : "border"
        }
      >
        {modalName === "loadMap" ? <LoadMapContent userMaps={userMaps} /> : <></>}
        {modalName === "save" ? <SaveMapContent /> : <></>}
        {modalName === "reset" ? <ResetMapContent /> : <></>}
        {modalName === "levelStart" ? (
          <LevelStartContent extras={levelExtras} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default ModalContent;
