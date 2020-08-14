import ECS from "@fritzy/ecs";

//WITH CANVAS IT MIGHT ACTUALLY BE MORE FUN TO SCRAP THE PACMAN-STYLE MOVEMENT
//I.E. only move when arrow key is being pressed

// export class MovementSystem extends ECS.System {
//   static query: { has?: string[]; hasnt?: string[] } = {
//     has: ["Car", "Velocity", "Coordinates"],
//     // hasnt: ["Path"],
//   };
//   static subscriptions: string[] = ["Velocity"];

//   constructor(ecs: any) {
//     super(ecs);
//   }

//   update(tick: number, entities: Array<any>) {
//     entities = [...entities];
//     // this.playerEntity = entities[0];
//     // this.npcEntities = this.entities.slice(1);
//     this.map = this.ecs.getEntity("global").Global.map.Map.map;
//     this.moveEntities(entities);
//     this.handleCollisions(entities);
//   }

//   generateNewCoords() {}

//   handleCollisions(entities: Array<any>) {
//     const mapCollisions = new Map();
//     const entityCollisions = this.detectEntityCollisions(entities);
//     this.resolveCollisions(mapCollisions, entityCollisions);
//   }

//   moveEntities(entities: Array<any>) {
//     const playerEntity = entities[0];
//     playerEntity.Coordinates.X +=
//       playerEntity.Velocity.vector.X * playerEntity.Velocity.speedConstant;
//     playerEntity.Coordinates.Y +=
//       playerEntity.Velocity.vector.Y * playerEntity.Velocity.speedConstant;

//     //move all NPC entities based on their paths
//   }

//   checkTileCollision(
//     x1: number,
//     y1: number,
//     x2: number,
//     y2: number,
//     w1: number = 25,
//     h1: number = 25,
//     w2: number = 25,
//     h2: number = 25
//   ) {
//     if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) {
//       return true;
//     }
//     return false;
//   }

//   detectEntityCollisions(entities: Array<any>) {
//     //returns array of collision tuples
//     const collisions: any[] = [];
//     const collisionMap = new Map();
//     for (let entity1 of entities) {
//       if (entity1.Collision.movable) {
//         for (let entity2 of entities) {
//           if (entity1.id === "player") {
//             console.log("entity1 !== entity2: ", entity1 !== entity2);
//             console.log(
//               "is collision ",
//               this.checkEntityCollision(entity1, entity2)
//             );
//             console.log(
//               "have not recorded entity1: ",
//               !collisionMap.has(entity1)
//             );
//             console.log(
//               "have not recorded entity2: ",
//               !collisionMap.has(entity2)
//             );
//           }
//           if (
//             entity1 !== entity2 &&
//             this.checkEntityCollision(entity1, entity2) &&
//             !collisionMap.has(entity1) &&
//             !collisionMap.has(entity2)
//           ) {
//             collisionMap.set(entity1, entity2);
//             collisions.push([entity1, entity2]);
//           }
//         }
//       }
//     }
//     return collisions;
//   }

//   checkEntityCollision(entity1: any, entity2: any) {
//     //ADD COLLISION CHECKING FOR CIRCULAR LIGHTS
//     console.log(entity2.id)
//     if (
//       entity1.Coordinates.X <
//         entity2.Coordinates.X + entity2.Renderable.renderWidth &&
//       entity1.Coordinates.X + entity1.Renderable.renderWidth >
//         entity2.Coordinates.X &&
//       entity1.Coordinates.Y <
//         entity2.Coordinates.Y + entity2.Renderable.renderHeight &&
//       entity1.Coordinates.Y + entity1.Renderable.renderHeight >
//         entity2.Coordinates.Y
//     ) {
//       return true;
//     }
//     return false;
//   }

//   resolveCollisions(
//     mapCollisions: Map<any, Array<any>>,
//     entityCollisions: Array<any>
//   ) {
//     //updates various entities to reflect outcome of collision
//     //if car, end game and display car crash (a car crash can only happen if player is involved)
//     //if coffee, add coffee component to driver entity with caffeine multiplier
//     //if light, check for red light via logic above

//     //If new coordinates overlap with nonexistant or non-drivable square, check previous vector to determine if it's different than current vector
//     for (let [eID, sq] of mapCollisions) {
//       let obstacles = sq.filter((s) => !s.drivable || s.schoolZone);
//       if (!obstacles.length) continue;
//       for (let o of obstacles) {
//         if (!o.drivable) {
//         }
//       }
//     }
//     //If yes, reset vector to previous vector and update new coordinates in accordance with that vector instead
//     //If no, set speed to 0, coordinates to previous coordinates, and wait for new vector to be received
//     //return previous coordinates
//     //If new coordinates overlap with schoolZone square AND driver entity does not have a schoolZone component,
//     //assign schoolZone component to driver entity with speed constant multiplier (aka 0.5)
//     //when moving driver entities, always check first to see if entity has a schoolZone component
//     //if yes, multiply Velocity.speedConstant times SchoolZone.multiplier,
//     //if no, just use entity's Velocity speed constant
//     //If new coordinates overlap with schoolZone square AND driver has a schoolZone component,
//     //remove schoolZone component from entity
//     for (let ec of entityCollisions) {
//       console.log(`${ec[0].id} collided with ${ec[1].id}`);
//     }
//   }

//   getPreviousCoordinate(
//     x: number,
//     y: number,
//     vx: number,
//     vy: number,
//     s: number
//   ) {
//     return {
//       X: x - vx * s,
//       Y: y - vy * s,
//     };
//   }
// }

export class MovementSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Car", "Velocity"],
    hasnt: ["Path"],
  };

  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Array<any>) {
    const playerEntity = [...entities][0];
    const speedConstant = playerEntity.SchoolZone
      ? playerEntity.Velocity.speedConstant * playerEntity.SchoolZone.multiplier
      : playerEntity.Velocity.speedConstant;
    playerEntity.Coordinates.X +=
      playerEntity.Velocity.vector.X * speedConstant;
    playerEntity.Coordinates.Y +=
      playerEntity.Velocity.vector.Y * speedConstant;
  }
}

// export class MoveNPC extends ECS.System {
//   static query: { has?: string[]; hasnt?: string[] } = {
//     has: ["Car", "Velocity", "Path"],
//   };

//   constructor(ecs: any) {
//     super(ecs);
//   }

//   update(tick: number, entities: Array<any>) {}
// }
