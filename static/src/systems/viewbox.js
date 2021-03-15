import EntityComponentSystem from "@fritzy/ecs";
export class ViewBoxSystem extends EntityComponentSystem.System {
    constructor(ecs) {
        super(ecs);
        this.mapOffscreen = (document.getElementById("map-offscreen"));
    }
    update(tick, entities) {
        let mapEntity = entities.values().next().value;
        let { ViewBox } = mapEntity;
        let map = mapEntity.Map.map;
        // console.log(this.mapOffscreen);
        ViewBox.w = this.mapOffscreen.width / 4;
        ViewBox.h = this.mapOffscreen.height / 4;
        ViewBox.x = map.get(map.playerHome).coordinates.X - ViewBox.w / 2;
        ViewBox.y = map.get(map.playerHome).coordinates.Y - ViewBox.h / 2;
        if (ViewBox.x < 0)
            ViewBox.x = 0;
        if (ViewBox.y < 0)
            ViewBox.y = 0;
        if (ViewBox.x + ViewBox.w > this.mapOffscreen.width)
            ViewBox.x = this.mapOffscreen.width - ViewBox.w;
        if (ViewBox.y + ViewBox.h > this.mapOffscreen.height)
            ViewBox.y = this.mapOffscreen.width - ViewBox.h;
    }
}
ViewBoxSystem.query = {
    has: ["ViewBox"],
};
