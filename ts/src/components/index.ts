import * as MapComponents from "./map";
import * as DriverComponents from "./driver";
import * as GlobalComponents from "./global";
import * as LightComponents from "./light";

const Components: { [key: string]: any } = {
  ...GlobalComponents,
  ...MapComponents,
  ...DriverComponents,
  ...LightComponents,
};

export default Components;
