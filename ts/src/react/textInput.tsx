import React, { useContext } from "react";
import { ModalInputContext } from "./modalInputContext";

const TextInput = () => {
  let [inputState, dispatch] = useContext(ModalInputContext);
  let {toggleModal} = window;
  return (
    <input
      type="text"
      onChange={(e) => {
        dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value });
      }}
      onKeyPress={(e) => {
          if (e.key === "Enter" && inputState.inputValue) {
            let input = inputState.inputValue === "" ? e : inputState.inputValue;
            inputState.submitInput(input);
            toggleModal(false);
            dispatch({ type: "SET_INPUT_VALUE", payload: "" }); 
          }
      }}
      value={inputState.inputValue}
      placeholder="Enter a unique name for your map"
    />
  );
};

export default TextInput;
