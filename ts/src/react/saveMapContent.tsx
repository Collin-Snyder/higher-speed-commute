import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";

const SaveMapContent = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_FUNC",
      payload: (name: string) => {
        window.game.designModule.saveAs(name);
      },
    });
  }, []);

  return (
    <input
      type="text"
      onChange={(e) => {
        dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
      }}
      value={inputState.inputValue}
      placeholder="Enter a unique name for your map"
    />
  );
};

export default SaveMapContent;
