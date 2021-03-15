//systems must be added in this order
import RenderBackground from "./renderGroup/renderBackground";
import RenderBorders from "./renderGroup/renderBorders";
import RenderOffscreenMap from "./renderGroup/renderOffscreenMap";
import RenderGameplayEntities from "./renderGroup/renderGameplayEntities";
import RenderSandboxMap from "./renderGroup/renderSandboxMap";
import RenderViewBox from "./renderGroup/renderViewBox";
import RenderMenus from "./renderGroup/renderMenus";
import RenderTopLevelGraphics from "./renderGroup/renderTopLevelGraphics";
export default {
    RenderBackground,
    RenderBorders,
    RenderOffscreenMap,
    RenderGameplayEntities,
    RenderSandboxMap,
    RenderViewBox,
    RenderMenus,
    RenderTopLevelGraphics,
};
