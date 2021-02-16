import React, { useState, ChangeEvent, useContext } from "react";
import { ModalInputContext } from "./modalInputContext";
import SelectionButton from "./selectionButton";

export interface ModalOption {
  value: string | number;
  label: string;
  [key: string]: any;
}

interface OptionListProps {
  listName: string;
  options: ModalOption[];
  optionsWillSubmit: boolean;
}

const OptionList = ({ listName, options, optionsWillSubmit }: OptionListProps) => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let {toggleModal} = window;

  let cssClass = listName === "loadMap" ? "columns" : "";
  let handleChange = (e: ChangeEvent<HTMLInputElement>) => {};
  
  if (optionsWillSubmit) {
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      inputState.submitActions[e.target.value]();
    }
  } else  {
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
    };
  }


  return (
    <div
      id="modal-options"
      className={cssClass}
      onKeyPress={(e) => {
        if (e.key === "Enter" && inputState.inputValue) {
          let input = inputState.inputValue === "" ? e : inputState.inputValue;
          inputState.submitInput(input);
          toggleModal(false);
          dispatch({ type: "SET_INPUT_VALUE", payload: "" });
        }
      }}
    >
      {options.map(({ value, label }) => (
        <SelectionButton
          name={listName}
          value={value}
          label={label}
          selected={inputState.inputValue == value}
          willSubmit={optionsWillSubmit}
          handleChange={handleChange}
          key={value}
        />
      ))}
    </div>
  );
};

export default OptionList;
