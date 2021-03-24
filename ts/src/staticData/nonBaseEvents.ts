import Game from "../main";
import { Entity } from "@fritzy/ecs";
import { userHasCompletedGame, updateLastCompletedLevel } from "../localDb";

export const nonBaseEvents: INonBaseEvent[] = [
  {
    name: "raceFinished",
    action: onRaceFinished,
  },
  {
    name: "nextLevel",
    action: onNextLevel,
  },
  {
    name: "saveProgress",
    action: onSaveProgress,
  },
  {
    name: "redLight",
    action: onRedLight,
  },
  {
    name: "caffeinate",
    action: onCaffeinate,
  },
  {
    name: "setDesignTool",
    action: onSetDesignTool,
  },
  {
    name: "save",
    action: onSave,
  },
  {
    name: "saveAs",
    action: onSaveAs,
  },
  {
    name: "loadSaved",
    action: onLoadSaved,
  },
  {
    name: "undo",
    action: onUndo,
  },
  {
    name: "redo",
    action: onRedo,
  },
  {
    name: "resetMap",
    action: onResetMap,
  },
  {
    name: "focusSelector",
    action: onFocusSelector,
  },
];

function onRaceFinished(game: Game, outcome: "won" | "lost" | "crash") {
  let caffeinated = game.ecs.queryEntities({
    has: ["Car", "CaffeineBoost"],
  });
  if (caffeinated.size) {
    for (let driver of caffeinated) {
      driver.removeComponentByType("CaffeineBoost");
    }
  }

  game.resetGameView();

  if (game.recordRaceData) game.saveRaceData(outcome);

  if (outcome === "won") {
    if (game.currentLevel.number === game.arcadeLevels)
      game.publish("endOfGame");
    else game.publish("win");
  }
  if (outcome === "lost") game.publish("lose");
  if (outcome === "crash") game.publish("crash");
}

function onNextLevel(game: Game) {
  let next = game.currentLevel.number ? game.currentLevel.number + 1 : 1;

  if (next > game.arcadeLevels) game.publish("endOfGame");
  else game.publish("start", next);
}

function onSaveProgress(game: Game) {
  if (game.lastCompletedLevel === game.arcadeLevels) {
    userHasCompletedGame()
      .then((result) => {
        game.hasCompletedGame = true;
        return updateLastCompletedLevel(0);
      })
      .then((result) => (game.lastCompletedLevel = 0))
      .catch((err) => console.error(err));
  } else {
    updateLastCompletedLevel(game.lastCompletedLevel).catch((err) =>
      console.error(err)
    );
  }
}

function onSetDesignTool(game: Game, tool: TDesignTool) {
  game.designModule.setDesignTool(tool);
}

function onSave(game: Game) {
  game.designModule.saveAsync().catch((err) => console.error(err));
}

function onSaveAs(game: Game) {
  game.designModule.openSaveAsModal();
}

function onLoadSaved(game: Game) {
  game.designModule.openLoadSavedModal();
}

function onUndo(game: Game) {
  game.designModule.undo();
}

function onRedo(game: Game) {
  game.designModule.redo();
}

function onResetMap(game: Game) {
  game.designModule.openResetModal();
}

function onCaffeinate(game: Game, driver: Entity, coffee: Entity) {
  coffee.removeComponentByType("Renderable");
  coffee.removeComponentByType("Collision");
  driver.addComponent("CaffeineBoost", { ...coffee.Caffeine });

  if (driver.id === "player") {
    let coffeeId = coffee.id.match(/\d+/g);
    if (coffeeId && coffeeId[0]) game.raceData?.logCoffee(Number(coffeeId[0]));
  }
}

function onRedLight(game: Game, driver: Entity, light: Entity) {
  if (driver.id === "player") {
    game.raceData?.logRedLight(light);
  }
}
function onFocusSelector(
  game: Game,
  selectorName: string,
  focusEntity: Entity
) {
  let selector = game.ecs.getEntity(`${selectorName}Selector`);
  selector.Selector.focusEntity = focusEntity;
}
