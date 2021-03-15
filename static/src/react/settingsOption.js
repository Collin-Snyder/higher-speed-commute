import React from "react";
const SettingsOption = ({ name, value, label, sprite, selected, handleChange, }) => {
    let cssClass = /Car/.test(sprite) ? "car" : "neighborhood";
    return (React.createElement("div", { className: `settings-option ${cssClass}` },
        React.createElement("label", { className: `${cssClass}` },
            React.createElement("input", { type: "radio", value: value, name: name, checked: selected, onChange: handleChange }),
            React.createElement("span", { className: `option-button-graphic ${selected ? `selected` : ``} ${cssClass}` },
                React.createElement("i", { className: `settings-icon ${sprite} ${cssClass}`, id: `${sprite}-icon` }))),
        label ? React.createElement("p", { className: "settings-option-label" }, label) : React.createElement(React.Fragment, null)));
};
export default SettingsOption;
