import ECS from "@fritzy/ecs";

export class MovePlayer extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car"],
    hasnt: ["Path"],
  };

  constructor(ecs: any, map: any) {
    super(ecs);
    this.map = map;
  }

  checkIfValidMove() {}
}

export class MoveNPC extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Path"],
  };
}
