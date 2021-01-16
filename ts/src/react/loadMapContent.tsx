import React, { useContext, useState, useEffect } from "react";
import OptionList, { ModalOption } from "./optionList";
import { ModalInputContext } from "./modalInputContext";
import { loadAllUserMaps } from "../state/localDb";
import Game from "../main";

const LoadMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let [mapOptions, setMapOptions] = useState<ModalOption[]>([]);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: (id: number) => {
        let { playMode, designModule } = window.game;

        if (playMode === "custom") window.game.publish("start", id);
        else designModule.loadSaved(id);
      },
    });
  }, []);

  useEffect(() => {
    loadAllUserMaps()
      .then((um) => {
        let options = um.map((m) => {
          let id = m.id || -1;
          return { value: id, label: m.name };
        });
        setMapOptions(options);
      })
      .catch((err) => console.error(err));
  }, []);

  if (!mapOptions.length) return <p>You have no saved maps</p>;
  return <OptionList listName="loadMap" options={mapOptions} />;
};

export default LoadMapContent;
