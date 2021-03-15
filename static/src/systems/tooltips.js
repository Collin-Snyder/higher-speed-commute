import ECS from "@fritzy/ecs";
export class TooltipSystem extends ECS.System {
    constructor(_game, ecs, step) {
        super(ecs);
        this._game = _game;
        this.step = step;
    }
    update(tick, entities) {
        for (let entity of entities) {
            let { Tooltip } = entity;
            if (!this.coordinatesSet(Tooltip.coordinates))
                this.setTooltipCoordinates(entity);
            if (Tooltip.fadeOut) {
                if (Tooltip.opacity <= 0) {
                    entity.removeComponentByType("Tooltip");
                    continue;
                }
                else {
                    Tooltip.opacity -= Tooltip.fadeStep;
                    if (Tooltip.opacity < 0)
                        Tooltip.opacity = 0;
                }
            }
            else {
                if (Tooltip.waitTime > 0) {
                    Tooltip.waitTime -= this.step;
                    if (Tooltip.waitTime < 0)
                        Tooltip.waitTime = 0;
                }
                else if (Tooltip.opacity < 1) {
                    Tooltip.opacity += Tooltip.fadeStep;
                    if (Tooltip.opacity > 1)
                        Tooltip.opacity = 1;
                }
            }
        }
    }
    coordinatesSet({ x, y }) {
        return x >= 0 && y >= 0;
    }
    calculateTooltipDimensions() { }
    setTooltipCoordinates(entity) {
        this._game.uictx.font = "20";
        let textDimentions;
        //calculate tooltip dimensions based on text size and text content
        //align center of tooltip with center of entity
        //set tooltip x = tooltip center - tooltip width / 2
        //set tooltip y = entity y + entity height
        //return entity
    }
}
TooltipSystem.query = {
    has: ["Tooltip", "Coordinates", "Renderable"],
};
