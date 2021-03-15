import React, { createContext, useContext } from "react";
import Game, { game } from "../../main";

export const GameContext = createContext<Game>(game);

// const initialState = game;

interface GameContextProviderProps {
  children: any;
}

export const GameContextProvider = ({ children }: GameContextProviderProps) => {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const game = useContext(GameContext);
  if (!game)
    throw new Error(
      "GameContext is being used outside of its context provider"
    );
  return game;
};
