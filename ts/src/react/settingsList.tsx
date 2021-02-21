import React from "react";
import SettingsOption from "./settingsOption";

interface ISettingsListProps {
  list: { label: string; value: string; sprite: string }[];
}

const SettingsList = ({ list }: ISettingsListProps) => {
  return (
    <div className="settings-list-container">
      {list.map(({ value, label, sprite }) => (
        <></>
      ))}
    </div>
  );
};

export default SettingsList;
