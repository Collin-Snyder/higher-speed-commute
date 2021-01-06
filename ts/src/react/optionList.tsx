import React, { useState, ChangeEvent, useContext } from "react";
import {ModalInputContext} from "./modalInputContext";
import SelectionButton from "./selectionButton";

export interface ModalOption {
  value: string | number;
  label: string;
  [key: string]: any;
}

interface OptionListProps {
  listName: string;
  options: ModalOption[];
}

const OptionList = ({ listName, options }: OptionListProps) => {
  // let [selected, setSelected] = useState("");
  let [inputState, dispatch] = useContext(ModalInputContext);

  let handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({type: "SET_INPUT_VALUE", payload: e.target.value});
    // setSelected(e.target.value);
  };

 
  return (
    <div id="modal-options" className={listName==="loadMap" ? "columns" : ""}>
      {options.map(({ value, label }) => (
        <SelectionButton
          name={listName}
          value={value}
          label={label}
          selected={inputState.inputValue == value}
          handleChange={handleChange}
          key={value}
        />
      ))}
    </div>
  );
};

export default OptionList;
