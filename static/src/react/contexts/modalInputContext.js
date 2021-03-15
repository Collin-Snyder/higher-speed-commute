import React, { createContext, useReducer } from "react";
export const ModalInputContext = createContext([]);
const initialState = {
    inputValue: "",
    submitInput: () => { },
    submitActions: {}
};
const reducer = (state, action) => {
    switch (action.type) {
        case "SET_INPUT_VALUE":
            return Object.assign(Object.assign({}, state), { inputValue: action.payload });
        case "SET_SUBMIT_FUNC":
            return Object.assign(Object.assign({}, state), { submitInput: action.payload });
        case "SET_SUBMIT_ACTIONS":
            return Object.assign(Object.assign({}, state), { submitActions: action.payload });
        case "ADD_SUBMIT_ACTIONS":
            return Object.assign(Object.assign({}, state), { submitActions: Object.assign(Object.assign({}, state.submitActions), action.payload) });
        default:
            return state;
    }
};
export const ModalInputContextProvider = ({ children, }) => {
    let [inputState, dispatch] = useReducer(reducer, initialState);
    return (React.createElement(ModalInputContext.Provider, { value: [inputState, dispatch] }, children));
};
