import React, { useEffect, useContext } from "react";
import { openModal } from "gameHelpers";
import { ModalInputContext } from "../contexts/modalInputContext";

const ControlsHelpContent = () => {
  let [, dispatch] = useContext(ModalInputContext);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        next: () => {
          openModal("saveHelp");
        },
        back: () => {
          openModal("rulesHelp");
        },
      },
    });

    dispatch({ type: "SET_INPUT_VALUE", payload: "useEvent" });
  }, []);

  return <i id="controls-help-graphic" className="help-graphic"></i>;
};

export default ControlsHelpContent;
