import React, { useContext, useState, useEffect } from "react";
import OptionList, { ModalOption } from "../optionList";
import { ModalInputContext } from "../modalInputContext";
import { loadAllUserMaps, loadCompletedLevels } from "../../state/localDb";

const LoadMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let [mapOptions, setMapOptions] = useState<ModalOption[]>([]);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        load: (id: number) => {
          let { playMode, designModule } = window.game;
          window.toggleModal(false);
          if (playMode === "custom" || playMode === "arcade")
            window.game.publish("start", id);
          else designModule.loadSaved(id);
        },
        delete: (id: number) => {
          window.game.designModule.deleteMap(id);
          window.toggleModal(false);
        },
      },
    });
  }, []);

  useEffect(() => {
    let loadFunc =
      window.game.playMode === "arcade" ? loadCompletedLevels : loadAllUserMaps;

    loadFunc()
      .then((um) => {
        let options = um.map((m) => {
          let id = m.id || -1;
          return { value: id, label: m.name };
        });
        setMapOptions(options);
      })
      .catch((err) => console.error(err));
  }, []);

  if (!mapOptions.length)
    return (
      <p>
        You have no {window.game.playMode === "arcade" ? "completed levels" : "custom maps"}
      </p>
    );
  return <OptionList listName="loadMap" options={mapOptions} optionsWillSubmit={false} />;
};

export default LoadMapContent;
