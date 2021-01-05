declare module "@fritzy/ecs" {
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

    export class Entity {

        constructor(ecs: ECS, definition?: object);
    
        ecs: ECS;
        id: string;
        components: object;
        componentMap: object;
        tags: Set<any>;
        updatedComponents: number;
        updatedValues: number;
        [key: string]: any;
    
        has(tagOrComponent: string): Array<BaseComponent>;
        addTag(tag: string): void;
        removeTag(tag: string): void;
        addComponent(type: string, definition: object, delayCache?: boolean): BaseComponent;
        removeComponentByType(type: string): void;
        removeComponent(component: BaseComponent, delayCache?: any, destroy?: boolean): void;
        getObject(): object;
    
        destroy(): void;
    
    }

    export class BaseComponent {

        constructor(ecs: ECS, entity: Entity, initialValues: any);
    
        ecs: ECS;
        entity: Entity;
        type: string;
        id: string;
        updated: number;
        [key: string]: any;
    
        destroy(remove?: boolean): void;
    }

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

    const e: {
        ECS: typeof ECS;
        System: typeof System;
        Component: typeof BaseComponent;
    };
    export default e;
}
