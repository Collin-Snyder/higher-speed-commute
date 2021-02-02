import RenderBackground from "./renderGroup/renderBackground";
import RenderBorders from "./renderGroup/renderBorders";
import RenderMap from "./renderGroup/renderMap";
import RenderGameplayEntities from "./renderGroup/renderGameplayEntities";
import RenderSandbox from "./renderGroup/renderSandbox";
import RenderViewBox from "./renderGroup/renderViewBox";
import RenderMenus from "./renderGroup/renderMenus";
import RenderButtonModifiers from "./renderGroup/renderButtonModifiers";
import RenderTopLevelGraphics from "./renderGroup/renderButtonModifiers";

//systems must be added in this order
const RenderGroup = {
  RenderBackground,
  RenderBorders,
  RenderMap,
  RenderGameplayEntities,
  RenderSandbox,
  RenderViewBox,
  RenderMenus,
  RenderButtonModifiers,
  RenderTopLevelGraphics,
};

export default RenderGroup;
