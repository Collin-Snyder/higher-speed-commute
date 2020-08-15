import { ECS } from "ecs";
import { Entity } from "entity";
import { QueryCache } from "querycache";

export abstract class System {

    constructor(ecs: ECS);

    ecs: ECS;
    changes: Array<any>;
    lastTick: number;
    query: QueryCache;

    abstract update(tick: number, entities: Set<Entity>): void;

    destroy(): void;
}