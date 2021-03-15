import React from "react";
const SettingsList = ({ list }) => {
    return (React.createElement("div", { className: "settings-list-container" }, list.map(({ value, label, sprite }) => (React.createElement(React.Fragment, null)))));
};
export default SettingsList;
