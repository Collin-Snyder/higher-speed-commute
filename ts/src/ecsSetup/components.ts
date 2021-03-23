import * as MapComponents from "./components/mapComponents";
import * as DriverComponents from "./components/driverComponents";
import * as LightComponents from "./components/lightsComponents";
import * as ItemComponents from "./components/itemsComponents";
import * as ButtonComponents from "./components/buttonsComponents";
import * as AnimationComponents from "./components/animationComponents";
import * as MovementComponents from "./components/movementComponents";
import * as RenderComponents from "./components/renderingComponents";
import * as UserInteractionComponents from "./components/userInteractionComponents";

const Global = {
  properties: {
    game: null,
    map: null,
    player: "<Entity>",
    inputs: {},
    spriteSheet: null,
    spriteMap: {},
    bgSheet: null,
    bgMap: {},
    mode: "init",
  },
};

const Components: { [key: string]: any } = {
  Global,
  ...MapComponents,
  ...DriverComponents,
  ...LightComponents,
  ...ItemComponents,
  ...ButtonComponents,
  ...AnimationComponents,
  ...MovementComponents,
  ...RenderComponents,
  ...UserInteractionComponents,
};

export default Components;
