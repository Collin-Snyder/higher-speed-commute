import React, { useState, ChangeEvent } from "react";
import SelectionButton from "./selectionButton";

export interface ModalOptions {
  value: string | number;
  label: string;
}

interface OptionListProps {
  listName: string;
  options: ModalOptions[];
}

const OptionList = ({ listName, options }: OptionListProps) => {
  let [selected, setSelected] = useState("");

  let handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.value);
  };
  return (
    <div id="modal-options">
      {options.map(({ value, label }) => (
        <SelectionButton
          name={listName}
          value={value}
          label={label}
          selected={selected == value}
          handleChange={handleChange}
          key={value}
        />
      ))}
    </div>
  );
};

export default OptionList;
