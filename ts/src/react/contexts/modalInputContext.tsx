import React, { createContext, useReducer } from "react";

export const ModalInputContext = createContext<any[]>([]);

const initialState = {
  inputValue: "",
  submitInput: () => {},
  submitActions: {}
};

type ModalInputReducerAction = "SET_INPUT_VALUE" | "SET_SUBMIT_FUNC" | "SET_SUBMIT_ACTIONS" | "ADD_SUBMIT_ACTIONS";

interface Action {
  type: ModalInputReducerAction;
  payload: any;
}
const reducer = (state: any, action: Action) => {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_SUBMIT_FUNC":
      return { ...state, submitInput: action.payload };
    case "SET_SUBMIT_ACTIONS":
      return {...state, submitActions: action.payload};
    case "ADD_SUBMIT_ACTIONS":
      return {...state, submitActions: {...state.submitActions, ...action.payload}}
    default:
      return state;
  }
};

interface ModalInputContextProviderProps {
  children: any;
}

export const ModalInputContextProvider = ({
  children,
}: ModalInputContextProviderProps) => {
  let [inputState, dispatch] = useReducer(reducer, initialState);

  return (
    <ModalInputContext.Provider value={[inputState, dispatch]}>
      {children}
    </ModalInputContext.Provider>
  );
};
