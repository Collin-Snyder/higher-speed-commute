import React, { ChangeEvent } from "react";

export interface ISettingsOptionProps {
  name: string;
  value: string;
  label: string;
  sprite: string;
  selected: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const SettingsOption = ({
  name,
  value,
  label,
  sprite,
  selected,
  handleChange,
}: ISettingsOptionProps) => {
  let cssClass = /Car/.test(sprite) ? "car" : "neighborhood";
  return (
    <div className={`settings-option ${cssClass}`}>
      <label className={`${cssClass}`}>
        <input
          type="radio"
          value={value}
          name={name}
          checked={selected}
          onChange={handleChange}
        />
        <span
          className={`option-button-graphic ${
            selected ? `selected` : ``
          } ${cssClass}`}
        >
          <i
            className={`settings-icon ${sprite} ${cssClass}`}
            id={`${sprite}-icon`}
          ></i>
        </span>
      </label>
      {label ? <p className="settings-option-label">{label}</p> : <></>}
    </div>
  );
};

export default SettingsOption;
