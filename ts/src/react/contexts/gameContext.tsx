import React, { createContext, useContext } from "react";
import Game, { game } from "../../main";

export const GameContext = createContext<Game | null>(null);

export const GameContextProvider = ({ children }: IProviderProps) => {
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
