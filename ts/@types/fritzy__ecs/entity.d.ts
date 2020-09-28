import { ECS } from "ecs";
import { BaseComponent } from "component";

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
