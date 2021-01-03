import React, { ChangeEvent } from "react";

interface SelectionButtonProps {
  value: number | string;
  name: string;
  label: string;
  selected: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const SelectionButton = ({
  value,
  name,
  label,
  selected,
  handleChange,
}: SelectionButtonProps) => {
  let isMapSelector = name === "loadMap";
  let labelFormatted = label;
  // if (isMapSelector) {
  //   let labelTrunc = label.length > 11 ? `${label.slice(0, 10)}...` : label;
  //   labelFormatted = labelTrunc.toUpperCase();
  // }
  return (
    <label className={`option-button ${isMapSelector ? `small` : ``}`}>
      <input
        type="radio"
        value={value}
        name={name}
        checked={selected}
        onChange={handleChange}
      />
      <span className={`option-button-graphic ${selected ? `selected` : ``}`}>
        {isMapSelector ? <i className="map-icon"></i> : <></>}
        <h3 className="option-button-label">{labelFormatted}</h3>
      </span>
    </label>
  );
};

export default SelectionButton;
