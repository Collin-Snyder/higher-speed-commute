import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";
import TextInput from "../textInput";

const SaveMapContent = () => {
  let [, dispatch] = useContext(ModalInputContext);

  useEffect(() => {
    dispatch({
      type: "SET_SUBMIT_ACTIONS",
      payload: {
        save: (name: string) => {
          console.log("Saving map with name: ", name)
          window.game.designModule.saveAs(name);
        },
      },
    });
  }, []);

  return <TextInput />;
};

export default SaveMapContent;
