var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useContext, useState } from "react";
import useAsyncEffect from "use-async-effect";
import { useGame } from "../contexts/gameContext";
import { ModalInputContext } from "../contexts/modalInputContext";
import OptionList from "../optionList";
export const cars = [
    { value: "blue", label: "", sprite: "blueCar" },
    { value: "green", label: "", sprite: "greenCar" },
    { value: "yellow", label: "", sprite: "yellowCar" },
    { value: "orange", label: "", sprite: "orangeCar" },
    { value: "pink", label: "", sprite: "pinkCar" },
    { value: "white", label: "", sprite: "whiteCar" },
    { value: "purple", label: "", sprite: "purpleCar" },
    { value: "aqua", label: "", sprite: "aquaCar" },
    { value: "tan", label: "", sprite: "tanCar" },
];
export const neighborhoods = [
    {
        value: "default",
        label: "Pleasanton, IL",
        sprite: "defaultTerrainPreview",
    },
    {
        value: "desert",
        label: "Albuquerque, NM",
        sprite: "desertTerrainPreview",
    },
    {
        value: "snow",
        label: "Fairbanks, AK",
        sprite: "snowTerrainPreview",
    },
];
const SettingsContent = () => {
    const game = useGame();
    let [, dispatch] = useContext(ModalInputContext);
    let [saveError, setSaveError] = useState(false);
    useAsyncEffect((isMounted) => __awaiter(void 0, void 0, void 0, function* () {
        dispatch({
            type: "SET_SUBMIT_ACTIONS",
            payload: {
                save: (settingsObj) => {
                    game
                        .updateUserSettings(settingsObj)
                        .then((result) => {
                        setSaveError(false);
                        window.toggleModal(false);
                    })
                        .catch((err) => {
                        setSaveError(true);
                    });
                },
            },
        });
        let user = yield game.getUserSettings();
        if (!isMounted())
            return;
        let { color, terrain } = user;
        dispatch({
            type: "SET_INPUT_VALUE",
            payload: { color, terrain },
        });
    }), []);
    return (React.createElement(React.Fragment, null,
        saveError ? (React.createElement("p", { className: "red" }, "There was an issue saving your settings. Please try again.")) : (React.createElement(React.Fragment, null)),
        React.createElement("div", { className: "settings-list-container" },
            React.createElement("h3", { className: "settings-header" }, "Choose Your Car"),
            React.createElement(OptionList, { listName: "colorSettings", options: cars, optionsWillSubmit: false })),
        React.createElement("div", { className: "settings-list-container" },
            React.createElement("h3", { className: "settings-header" }, "Choose Your Neighborhood"),
            React.createElement(OptionList, { listName: "terrainSettings", options: neighborhoods, optionsWillSubmit: false }))));
};
export default SettingsContent;
