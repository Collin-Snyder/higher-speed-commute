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

    has(tagOrComponent: any): Array<BaseComponent>;
    addTag(tag: any): void;
    removeTag(tag: any): void;
    addComponent(type: any, definition: any, delayCache?: any): BaseComponent;
    removeComponentByType(cname: any): void;
    removeComponent(component: any, delayCache?: any, destroy?: boolean): void;
    getObject(): any;

    destroy(): void;

}
