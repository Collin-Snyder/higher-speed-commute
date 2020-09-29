import {ECS} from "ecs";
import {Entity} from "entity";
import {QueryCache} from "querycache";
import {BaseComponent} from "./component";

interface Change {
    component: BaseComponent,
    op: string,
    key?: string,
    old?: any,
    value?: any
}

export abstract class System {

    protected constructor(ecs: ECS);

    ecs: ECS;
    changes: Array<Change>;
    lastTick: number;
    query: QueryCache;

    abstract update(tick: number, entities: Set<Entity>): void;

    destroy(): void;
}