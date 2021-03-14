import React, { useContext, useEffect, useState } from "react";
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

  useAsyncEffect(async (isMounted) => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        save: (settingsObj: { color: TCarColor; terrain: TTerrainStyle }) => {
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

    let user = await game.getUserSettings();

    if (!isMounted()) return;

    let { color, terrain } = user;

    dispatch({
      type: "SET_INPUT_VALUE",
      payload: { color, terrain },
    });
  }, []);

  return (
    <>
      {saveError ? (
        <p className="red">
          There was an issue saving your settings. Please try again.
        </p>
      ) : (
        <></>
      )}
      <div className="settings-list-container">
        <h3 className="settings-header">Choose Your Car</h3>
        <OptionList
          listName="colorSettings"
          options={cars}
          optionsWillSubmit={false}
        />
      </div>
      <div className="settings-list-container">
        <h3 className="settings-header">Choose Your Neighborhood</h3>
        <OptionList
          listName="terrainSettings"
          options={neighborhoods}
          optionsWillSubmit={false}
        />
      </div>
    </>
  );
};

export default SettingsContent;
