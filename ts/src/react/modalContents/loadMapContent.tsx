import React, { useContext, useState, useEffect } from "react";
import OptionList from "../optionList";
import { ModalInputContext } from "../contexts/modalInputContext";
import { loadAllUserMaps, loadCompletedLevels } from "../../state/localDb";
import { useGame } from "../contexts/gameContext";

const LoadMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let [mapOptions, setMapOptions] = useState<IModalOption[]>([]);
  const game = useGame();

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        load: (id: number) => {
          let { playMode, designModule } = game;
          window.toggleModal(false);
          if (playMode === "custom" || playMode === "completed")
            game.publish("start", id);
          else if (!playMode) designModule.loadSaved(id);
        },
        delete: (id: number) => {
          game.designModule.deleteMap(id);
          window.toggleModal(false);
        },
      },
    });
  }, []);

  useEffect(() => {
    let loadFunc =
      game.playMode === "completed" ? loadCompletedLevels : loadAllUserMaps;

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
        You have no {game.playMode === "completed" ? "completed levels" : "custom maps"}
      </p>
    );
  return <OptionList listName="loadMap" options={mapOptions} optionsWillSubmit={false} />;
};

export default LoadMapContent;
