//ALL COLLISION SYSTEMS
//Generate new player coordinates according to vector and speed constant (if new vector received, always reset speed to original speed constant)
//Save previous vector
//ROAD DETECTION
//If new coordinates overlap with nonexistant or non-drivable square, check previous vector to determine if it's different than current vector
//If yes, reset vector to previous vector and update new coordinates in accordance with that vector instead
//If no, set speed to 0, coordinates to previous coordinates, and wait for new vector to be received
//return previous coordinates
//If new coordinates overlap with schoolZone square AND driver entity does not have a schoolZone component,
//assign schoolZone component to driver entity with speed constant multiplier (aka 0.5)
//when moving driver entities, always check first to see if entity has a schoolZone component
//if yes, multiply Velocity.speedConstant times SchoolZone.multiplier,
//if no, just use entity's Velocity speed constant
//If new coordinates overlap with schoolZone square AND driver has a schoolZone component,
//remove schoolZone component from entity

//RED LIGHT DETECTION (player, NPCs)
//If new coordinates overlap with red light square AND current coordinates are NOT a red light square:
//set speed to 0, coordinates to previous coordinates, and wait for new vector to be received or for light to turn green
//return previous coordinates
//CAR CRASH DETECTION (player, NPCs)
//Broad Phase
//Determine other cars within bounding box of given entity
//Narrow Phase
//Check if new coordinates are in collision with any cars within bounding box
//If yes:
//If player or boss, return new coordinates (some logic for rendering CRASH animation and game over happens)
//If other NPC, return old coordinates (do not set speed to 0, otherwise will need method to check if car in front of it has moved)
//Will need to ensure that NPCs are on paths that do not collide head-on
//Return correct player coordinates from collision system and update player coordinates accordingly
//Render

import ECS from "@fritzy/ecs";

export class CollisionSystem extends ECS.System {
  static query: { has?: string[]; hasnt?: string[] } = {
    has: ["Collision", "Coordinates", "Renderable"],
  };
  static subscriptions: string[] = ["Velocity"];

  constructor(ecs: any) {
    super(ecs);
  }

  update(tick: number, entities: Array<any>) {
    this.collisionEntities = [...entities];
    this.map = this.ecs.getEntity("global").Global.map.Map.map;
    const mapCollisions = this.detectMapCollisions();
    // const mapCollisions = new Map();
    const entityCollisions = this.detectEntityCollisions();
    this.resolveCollisions(mapCollisions, entityCollisions);
  }

  checkTileCollision(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w1: number = 25,
    h1: number = 25,
    w2: number = 25,
    h2: number = 25
  ) {
    if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) {
      return true;
    }
    return false;
  }

  checkEdgeCollision(x: number, y: number, w: number = 25, h: number = 25) {
    if (
      x < 0 ||
      y < 0 ||
      x + w > this.map.pixelWidth ||
      y + h > this.map.pixelHeight
    ) {
      return true;
    }
    return false;
  }

  checkEntityCollision(entity1: any, entity2: any) {
    //ADD COLLISION CHECKING FOR CIRCULAR LIGHTS
    if (
      entity1.Coordinates.X <
        entity2.Coordinates.X + entity2.Renderable.renderWidth &&
      entity1.Coordinates.X + entity1.Renderable.renderWidth >
        entity2.Coordinates.X &&
      entity1.Coordinates.Y <
        entity2.Coordinates.Y + entity2.Renderable.renderHeight &&
      entity1.Coordinates.Y + entity1.Renderable.renderHeight >
        entity2.Coordinates.Y
    ) {
      return true;
    }
    return false;
  }

  getPreviousCoordinate(
    x: number,
    y: number,
    vx: number,
    vy: number,
    s: number
  ) {
    return {
      X: x - vx * s,
      Y: y - vy * s,
    };
  }

  detectMapCollisions() {
    let mapCollisions = new Map();
    for (let entity of this.collisionEntities) {
      if (entity.Collision.movable) {
        //If new coordinates overlap with nonexistant or non-drivable square, check previous vector
        //to determine if it's different than current vector
        // const surroundingSquares = this.map.getSurroundingSquares(
        //   entity.Coordinates.X,
        //   entity.Coordinates.Y
        // );

        let collisions = [];
        let x = entity.Coordinates.X;
        let y = entity.Coordinates.Y;

        if (
          this.checkEdgeCollision(
            x + 2,
            y + 2,
            entity.Renderable.renderWidth - 2,
            entity.Renderable.renderHeight - 2
          )
        ) {
          collisions.push(null);
        } else {
          for (let square of this.map.squares) {
            if (!square) continue;
            let sqCoords = square.coordinates();
            if (
              this.checkTileCollision(
                entity.Coordinates.X + 2,
                entity.Coordinates.Y + 2,
                sqCoords.X,
                sqCoords.Y,
                entity.Renderable.renderWidth - 2,
                entity.Renderable.renderHeight - 2,
                25,
                25
              )
            ) {
              collisions.push(square);
            }
          }
        }
        //@ts-ignore
        mapCollisions.set(entity.id, collisions);
        collisions = [];
        // if (!next || !next.drivable) {
        //     //If new coordinates overlap with nonexistant or non-drivable square, check previous vector
        //     //to determine if it's different than current vector
        //         //If yes, reset vector to previous vector and update new coordinates in accordance with that vector instead
        //         //If no, set speed to 0, coordinates to previous coordinates, and wait for new vector to be received
        //     //return previous coordinates

        // }

        // if (next.schoolZone){}
      }
    }
    return mapCollisions;
    //If new coordinates overlap with schoolZone square AND driver entity does not have a schoolZone component,
    //assign schoolZone component to driver entity with speed constant multiplier (aka 0.5)
    //when moving driver entities, always check first to see if entity has a schoolZone component
    //if yes, multiply Velocity.speedConstant times SchoolZone.multiplier,
    //if no, just use entity's Velocity speed constant
    //If new coordinates overlap with schoolZone square AND driver has a schoolZone component,
    //remove schoolZone component from entity
  }

  detectEntityCollisions() {
    //returns array of collision tuples
    const collisions: any[] = [];
    const collisionMap = new Map();
    for (let entity1 of this.collisionEntities) {
      if (entity1.Collision.movable) {
        for (let entity2 of this.collisionEntities) {
          if (
            entity1 !== entity2 &&
            this.checkEntityCollision(entity1, entity2) &&
            !collisionMap.has(entity1) &&
            !collisionMap.has(entity2)
          ) {
            collisionMap.set(entity1, entity2);
            collisions.push([entity1, entity2]);
          }
        }
      }
    }
    return collisions;
  }

  resolveCollisions(
    mapCollisions: Map<any, Array<any>>,
    entityCollisions: Array<any>
  ) {
    //updates various entities to reflect outcome of collision
    //if car, end game and display car crash (a car crash can only happen if player is involved)
    //if coffee, add coffee component to driver entity with caffeine multiplier
    //if light, check for red light via logic above

    //If new coordinates overlap with nonexistant or non-drivable square, check previous vector to determine if it's different than current vector
    for (let [entityID, sq] of mapCollisions) {
      // let obstacles = sq.filter((s) => !s || !s.drivable || s.schoolZone);
      let entity = this.ecs.getEntity(entityID);
      let boundaries = sq.filter((s) => !s || !s.drivable);
      let schoolZones = sq.filter((s) => s && s.schoolZone);
      // if (!obstacles.length) continue;
      if (boundaries.length) {
        this.stop(entity);
      } else if (schoolZones.length) {
        if (!entity.SchoolZone) {
          entity.addComponent("SchoolZone", { multiplier: 0.5 });
        }
      } else {
        if (entity.SchoolZone) {
          entity.removeComponentByType("SchoolZone");
        }
      }
    }
    //If yes, reset vector to previous vector and update new coordinates in accordance with that vector instead
    //If no, set speed to 0, coordinates to previous coordinates, and wait for new vector to be received
    //return previous coordinates
    //If new coordinates overlap with schoolZone square AND driver entity does not have a schoolZone component,
    //assign schoolZone component to driver entity with speed constant multiplier (aka 0.5)
    //when moving driver entities, always check first to see if entity has a schoolZone component
    //if yes, multiply Velocity.speedConstant times SchoolZone.multiplier,
    //if no, just use entity's Velocity speed constant
    //If new coordinates overlap with schoolZone square AND driver has a schoolZone component,
    //remove schoolZone component from entity

    for (let ec of entityCollisions) {
      let collider = ec[0];
      let target = ec[1];
      // console.log(`${collider.id} collided with ${target.id}`);
      if (target.has("Timer") && target.has("Color") && target.Color.color === "red") {
        this.stop(collider);
      }
    }
  }

  stop(entity: any) {
    let { X, Y } = this.getPreviousCoordinate(
      entity.Coordinates.X,
      entity.Coordinates.Y,
      entity.Velocity.vector.X,
      entity.Velocity.vector.Y,
      entity.Velocity.speedConstant
    );
    entity.Coordinates.X = X;
    entity.Coordinates.Y = Y;
  }
}

//Give each collidable entity a Collision component (player, boss, npcs, lights, coffees, key squares)
//Collision.properties - {movable: boolean}
//checkCollisions() - returns array of collision objects
//iterates over Collision entities that are movable (cars, not lights, coffees, etc) and checks them against every other Collidable entity
//adds any Collisions as objects in a Map, with the Collider entity as key
//only add one collision object per collision (i.e. if PlayerEntity has collision with BossEntity, only the PlayerEntity collision should be included)
//{type: coffee, collider: playerEntity, target: coffeeEntity}
//type refers to what the movable entity has collided with - coffee, light, car, etc
//resolveCollisions() - updates various entities to reflect outcome of collision
//if car, end game and display car crash (a car crash can only happen if player is involved)
//if coffee, add coffee component to driver entity with caffeine multiplier
//if light, check for red light via logic about

//BROAD PHASE
//Determine bounding box [tile-width]px wider than car around each car (25px in this case)
//
