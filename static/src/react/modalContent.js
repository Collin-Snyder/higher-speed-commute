import React from "react";
import LoadMapContent from "./modalContents/loadMapContent";
import SaveMapContent from "./modalContents/saveMapContent";
import ResetMapContent from "./modalContents/resetMapContent";
import LevelStartContent from "./modalContents/levelStartContent";
import ArcadeStartContent from "./modalContents/arcadeStartContent";
import QuitGameConfirmationContent from "./modalContents/quitGameConfirmationContent";
import QuitDesignConfirmationContent from "./modalContents/quitDesignConfirmationContent";
import MissingKeySquaresContent from "./modalContents/missingKeySquaresContent";
import SettingsContent from "./modalContents/settingsContent";
import RulesHelpContent from "./modalContents/rulesHelpContent";
import ControlsHelpContent from "./modalContents/controlsHelpContent";
import SaveHelpContent from "./modalContents/saveHelpContent";
const ModalContent = ({ modalName }) => {
    console.log("Rendering modal content for modal: ", modalName);
    let Content;
    let cssClass = "border";
    switch (modalName) {
        case "save":
            Content = SaveMapContent;
            cssClass = "";
            break;
        case "levelStart":
            Content = LevelStartContent;
            cssClass = "";
            break;
        case "missingKeySquares":
            Content = MissingKeySquaresContent;
            cssClass = "";
            break;
        case "settings":
            Content = SettingsContent;
            cssClass = "";
            break;
        case "loadMap":
            Content = LoadMapContent;
            break;
        case "arcadeStart":
            Content = ArcadeStartContent;
            break;
        case "reset":
            Content = ResetMapContent;
            break;
        case "quitGameConfirmation":
            Content = QuitGameConfirmationContent;
            break;
        case "quitDesignConfirmation":
            Content = QuitDesignConfirmationContent;
            break;
        case "rulesHelp":
            Content = RulesHelpContent;
            cssClass = "";
            break;
        case "controlsHelp":
            Content = ControlsHelpContent;
            cssClass = "";
            break;
        case "saveHelp":
            Content = SaveHelpContent;
            cssClass = "";
            break;
        default:
            Content = () => React.createElement(React.Fragment, null);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { id: "modal-content", className: cssClass },
            React.createElement(Content, null))));
};
export default ModalContent;
