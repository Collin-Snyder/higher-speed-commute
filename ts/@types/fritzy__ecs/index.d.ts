
declare module "@fritzy/ecs" {

    import { ECS as E } from "ecs";
    import { System as S } from "system";
    import { BaseComponent as C } from "component";

    export type { ECS } from "ecs";
    export type { Entity } from "entity";
    export type { System } from "system";
    export type { BaseComponent } from "component";

    const e: {
        ECS: typeof E;
        System: typeof S;
        Component: typeof C;
    };
    export default e;
}
