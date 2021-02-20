import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "../modalInputContext";

const MissingKeySquaresContent = () => {
//   let [, dispatch] = useContext(ModalInputContext);
  //   useEffect(() => {
  //     dispatch({
  //       type: "SET_SUBMIT_ACTIONS",
  //       payload: {
  //         save: () => {
  //           window.game.designModule.quitting = true;
  //           window.toggleModal(false);
  //           window.game.publish("save");
  //         },
  //         dontSave: () => {
  //           window.game.publish("quit");
  //           window.toggleModal(false);
  //         },
  //       },
  //     });
  //   }, []);
  return (
    <>
      <h2>Invalid Map</h2>
      <p>A valid map must contain a Player Home square, a Boss Home square, and an Office square.</p>
      <p>Please add these three elements to continue.</p>
    </>
  );
};

export default MissingKeySquaresContent;
