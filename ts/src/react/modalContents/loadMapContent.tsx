import React, { useContext, useState, useEffect } from "react";
import OptionList, { ModalOption } from "../optionList";
import { ModalInputContext } from "../modalInputContext";
import { loadAllUserMaps, loadCompletedLevels } from "../../state/localDb";
import Game from "../../main";

const LoadMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let [mapOptions, setMapOptions] = useState<ModalOption[]>([]);
  let [playMode, setPlayMode] = useState<string>("");

  useEffect(() => {
    setPlayMode(window.game.playMode);
  }, []);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: (id: number) => {
        let { playMode, designModule } = window.game;

        if (playMode === "custom" || playMode === "arcade") window.game.publish("start", id);
        else designModule.loadSaved(id);
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

  if (!mapOptions.length) return <p>You have no {playMode === "arcade" ? "completed levels" : "saved maps"}</p>;
  return <OptionList listName="loadMap" options={mapOptions} />;
};

export default LoadMapContent;
