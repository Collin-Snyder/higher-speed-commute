import React, { createContext, useContext } from "react";
import { game } from "../../main";
export const GameContext = createContext(game);
export const GameContextProvider = ({ children }) => {
    return React.createElement(GameContext.Provider, { value: game }, children);
};
export const useGame = () => {
    const game = useContext(GameContext);
    if (!game)
        throw new Error("GameContext is being used outside of its context provider");
    return game;
};
