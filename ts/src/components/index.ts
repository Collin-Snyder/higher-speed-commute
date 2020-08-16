import * as MapComponents from "./map";
import * as DriverComponents from "./driver";
import * as GlobalComponents from "./global";
import * as LightComponents from "./light";
import * as ItemComponents from "./item";

const Components: { [key: string]: any } = {
  ...GlobalComponents,
  ...MapComponents,
  ...DriverComponents,
  ...LightComponents,
  ...ItemComponents
};

export default Components;
