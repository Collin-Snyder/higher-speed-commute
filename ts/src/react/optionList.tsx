import { isSet } from "lodash";
import React, { useState, ChangeEvent, useContext } from "react";
import { ModalInputContext } from "./modalInputContext";
import SelectionButton from "./selectionButton";
import SettingsOption from "./settingsOption";

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

const OptionList = ({
  listName,
  options,
  optionsWillSubmit,
}: OptionListProps) => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let { toggleModal } = window;

  let isSettingsMenu = /Settings/.test(listName);
  //@ts-ignore;
  let settingsMenu = listName.match(/(\w+)(?=Settings)/) ? listName.match(/(\w+)(?=Settings)/)[0] : "";

  let cssClass =
    listName === "loadMap" ? "columns" : isSettingsMenu ? "horizontal" : "";

  let handleChange = (e: ChangeEvent<HTMLInputElement>) => {};

  if (optionsWillSubmit) {
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      inputState.submitActions[e.target.value]();
    };
  } else if (isSettingsMenu) {
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      
      dispatch({
        type: "SET_INPUT_VALUE",
        payload: { ...inputState.inputValue, [settingsMenu]: e.target.value },
      });
    };
  } else {
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
    };
  }

  let optionButtons = isSettingsMenu
    ? options.map(({ value, label, sprite }) => (
        <SettingsOption
          name={listName}
          //@ts-ignore
          value={value}
          label={label}
          sprite={sprite}
          selected={inputState.inputValue[settingsMenu] == value}
          handleChange={handleChange}
          key={value}
        />
      ))
    : options.map(({ value, label }) => (
        <SelectionButton
          name={listName}
          value={value}
          label={label}
          selected={inputState.inputValue == value}
          willSubmit={optionsWillSubmit}
          handleChange={handleChange}
          key={value}
        />
      ));

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
      {...optionButtons}
    </div>
  );
};

export default OptionList;
