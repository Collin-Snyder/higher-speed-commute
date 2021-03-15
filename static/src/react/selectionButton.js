import React from "react";
const SelectionButton = ({ value, name, label, selected, willSubmit, handleChange, }) => {
    let isMapSelector = name === "loadMap";
    let labelFormatted = label;
    return (React.createElement("label", { className: `option-button ${isMapSelector ? `small` : ``}` },
        React.createElement("input", { type: "radio", value: value, name: name, checked: selected, onChange: handleChange }),
        React.createElement("span", { className: `option-button-graphic ${selected ? `selected` : ``}` },
            isMapSelector ? React.createElement("i", { className: "map-icon" }) : React.createElement(React.Fragment, null),
            React.createElement("h3", { className: "option-button-label" }, labelFormatted))));
};
export default SelectionButton;
