import { Entity } from "@fritzy/ecs";
class DesignModule {
  public saved: boolean;
//   public mapEntity: Entity;
  public gridLoaded: boolean;
  public gridOverlay: HTMLImageElement;
  
  constructor() {
    this.saved = true;
    this.gridLoaded = false;
    this.gridOverlay = new Image();
    this.gridOverlay.src = "../design-grid.svg";

    this.gridOverlay.onload = () => {
      this.gridLoaded = true;
    };
  }
}

export default DesignModule;
