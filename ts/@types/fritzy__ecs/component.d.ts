import { ECS } from "ecs";
import { Entity } from "entity";

export class BaseComponent {

    constructor(ecs: ECS, entity: Entity, initialValues: any);

    ecs: ECS;
    entity: Entity;
    type: string;
    id: string;
    updated: number;

    destroy(remove?: boolean): void;
}
