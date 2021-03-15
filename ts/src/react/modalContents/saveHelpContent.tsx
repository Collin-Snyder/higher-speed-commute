import React, { useEffect, useContext } from "react";
import { ModalInputContext } from "../contexts/modalInputContext";

const SaveHelpContent = () => {
  let [, dispatch] = useContext(ModalInputContext);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        back: () => {
          window.toggleModal(true, "controlsHelp");
        },
      },
    });

    dispatch({ type: "SET_INPUT_VALUE", payload: "useEvent" });
  }, []);

  return <i id="save-help-graphic" className="help-graphic"></i>;
};

export default SaveHelpContent;
