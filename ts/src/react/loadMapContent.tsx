import React from "react";
import OptionList, { ModalOptions } from "./optionList";
import { MapProperties } from "./modalContainer";

interface LoadMapContentProps {
  userMaps: MapProperties[];
}

const LoadMapContent = ({ userMaps }: LoadMapContentProps) => {
  let options = userMaps.map((m) => {
    return { value: m.id, label: m.name };
  });
  return <OptionList listName="loadMap" options={options} />;
};

export default LoadMapContent;
