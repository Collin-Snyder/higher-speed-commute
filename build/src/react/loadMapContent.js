import React, { useContext, useState, useEffect } from "react";
import OptionList from "./optionList";
import { ModalInputContext } from "./modalInputContext";
import { loadAllUserMaps, loadCompletedLevels } from "../state/localDb";
const LoadMapContent = () => {
    let [inputState, dispatch] = useContext(ModalInputContext);
    let [mapOptions, setMapOptions] = useState([]);
    let [playMode, setPlayMode] = useState("");
    setPlayMode(window.game.playMode);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_FUNC",
            payload: (id) => {
                let { playMode, designModule } = window.game;
                if (playMode === "custom")
                    window.game.publish("start", id);
                else
                    designModule.loadSaved(id);
            },
        });
    }, []);
    useEffect(() => {
        let loadFunc = playMode === "arcade" ? loadCompletedLevels : loadAllUserMaps;
        loadFunc()
            .then((um) => {
            let options = um.map((m) => {
                let id = m.id || -1;
                return { value: id, label: m.name };
            });
            setMapOptions(options);
        })
            .catch((err) => console.error(err));
    }, [playMode]);
    if (!mapOptions.length)
        return React.createElement("p", null,
            "You have no ",
            playMode === "arcade" ? "completed levels" : "saved maps");
    return React.createElement(OptionList, { listName: "loadMap", options: mapOptions });
};
export default LoadMapContent;
