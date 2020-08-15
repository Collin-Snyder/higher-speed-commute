
declare module "@fritzy/ecs" {

    import { ECS as E } from "ecs";
    import { System as S } from "system";
    import { BaseComponent as C } from "component";

    export { ECS } from "ecs";
    export { Entity } from "entity";
    export { System } from "system";
    export { BaseComponent } from "component";

    const e: {
        ECS: typeof E;
        System: typeof S;
        Component: typeof C;
    };
    export default e;
}

