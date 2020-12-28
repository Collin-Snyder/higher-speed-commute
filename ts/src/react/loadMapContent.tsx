import React, { useContext, useEffect } from "react";
import OptionList, { ModalOptions } from "./optionList";
import { MapProperties } from "./modalContainer";
import { ModalInputContext } from "./modalInputContext";

interface LoadMapContentProps {
  userMaps: MapProperties[];
}

const LoadMapContent = ({ userMaps }: LoadMapContentProps) => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  
  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: (id: number) => {
        window.game.designModule.loadSaved(id);
      },
    });
  }, []);

  let options = userMaps.map((m) => {
    return { value: m.id, label: m.name };
  });
  return <OptionList listName="loadMap" options={options} />;
};

export default LoadMapContent;
