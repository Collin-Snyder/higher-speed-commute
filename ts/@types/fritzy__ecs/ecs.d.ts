import { Entity } from "entity";
import { System } from "system";
import { BaseComponent } from "component";

interface ComponentDefinition {
    properties?: object,
    multiset?: boolean,
    mapBy?: string,
    serialize?: {
        skip?: boolean,
        ignore?: Array<string>
    },
    init?: () => void,
    destroy?: () => void
}

interface QueryArgs {
    has?: Array<string>,
    hasnt?: Array<string>,
    persist?: boolean,
    updatedValues?: number,
    updatedComponents?: number
}

export class ECS {

    constructor();

    static definition: object;

    ticks: number;
    entities: Map<string, any>;
    types: object;
    tags: Set<any>;
    entityComponents: Map<string, any>;
    entityTags: Map<string, Set<string>>;
    components: Map<string, any>;
    queryCache: Map<any, any>;
    subscriptions: Map<string, Set<System>>;
    systems: Map<any, any>;
    refs: object;

    tick(): void;
    registerTags(tags: Array<string> | string): void;
    registerComponent(name: string, definition?: ComponentDefinition): void;
    registerComponentClass(klass: typeof BaseComponent): void;
    createEntity(definition: object): Entity;
    removeEntity(id: string | Entity): void;
    getEntity(entityId: string): Entity;
    queryEntities(args: QueryArgs): Set<Entity>;
    getComponents(name: string): Set<any>;
    subscribe(system: System, type: string): void;
    addSystem(group: string, system: System | typeof System): void;
    runSystemGroup(group: string): void;
}