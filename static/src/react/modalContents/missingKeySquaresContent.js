import React from "react";
const MissingKeySquaresContent = () => {
    return (React.createElement(React.Fragment, null,
        React.createElement("h2", null, "Invalid Map"),
        React.createElement("p", null,
            "A valid map must contain a ",
            React.createElement("span", { className: "blue" }, "Player Home"),
            " ",
            "square, a ",
            React.createElement("span", { className: "red" }, "Boss Home"),
            " square, and an",
            " ",
            React.createElement("span", { className: "yellow" }, "Office"),
            " square."),
        React.createElement("p", null, "Please add these three elements to continue.")));
};
export default MissingKeySquaresContent;
