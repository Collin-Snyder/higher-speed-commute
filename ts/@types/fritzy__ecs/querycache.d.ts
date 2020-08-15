import { ECS } from "ecs";
import { Entity } from "entity";

export class QueryCache {

    constructor(ecs: ECS, has: Array<string>, hasnt: Array<string>);

    ecs: ECS;
    has: Array<string>;
    hasnt: Array<string>;
    results: Set<Entity>;

    updateEntity(entity: Entity): void;
    clearEntity(entity: Entity): void;
    filter(updatedValues: number, updatedComponents: number): Set<Entity>;
}
