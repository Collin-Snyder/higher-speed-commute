import React, { createContext, useReducer } from "react";

export const ModalInputContext = createContext<any[]>([]);

const initialState = {
  inputValue: "",
  submitInput: () => {},
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_SUBMIT_FUNC":
      return { ...state, submitInput: action.payload };
  }
};

interface ModalInputContextProviderProps {
  children: any;
}

interface Action {
  type: ModalInputReducerAction;
  payload: any;
}

type ModalInputReducerAction = "SET_INPUT_VALUE" | "SET_SUBMIT_FUNC";

export const ModalInputContextProvider = ({
  children,
}: ModalInputContextProviderProps) => {
  const [inputState, dispatch] = useReducer(reducer, initialState);

  return (
    <ModalInputContext.Provider value={[inputState, dispatch]}>
      {children}
    </ModalInputContext.Provider>
  );
};
