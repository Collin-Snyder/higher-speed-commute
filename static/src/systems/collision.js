import ECS from "@fritzy/ecs";
import { calculateSpeedConstant, findRotatedVertex, findDegFromVector, checkCollision, getTileHitbox, isDiagonal, checkPointCollision, } from "gameMath";
const { max, min } = Math;
export class CollisionSystem extends ECS.System {
    constructor(_game, ecs) {
        super(ecs);
        this._game = _game;
        this.collidables = [];
        this.globalEntity = this.ecs.getEntity("global");
        this.playerCollisionVertices = [];
    }
    update(tick, entities) {
        this.collidables = [...entities];
        this.map = this._game.ecs.getEntity("map").MapData.map;
        let driverEntities = [
            this._game.ecs.getEntity("player"),
            this._game.ecs.getEntity("boss"),
        ];
        for (let driverEntity of driverEntities) {
            let mapCollision = this.handleMapCollisions(driverEntity);
            let entityCollision = this.handleEntityCollisions(driverEntity);
            // if (
            //   mapCollision !== "edge" &&
            //   mapCollision !== "offroad" &&
            //   entityCollision !== "redLight"
            // ) {
            let deg = findDegFromVector(driverEntity.Velocity.vector);
            if (deg >= 0)
                driverEntity.Renderable.degrees = deg;
            // }
            driverEntity.Collision.prevHb = driverEntity.Collision.currentHb();
        }
    }
    handleMapCollisions(entity) {
        let entityHb = entity.Collision.currentHb(findDegFromVector(entity.Velocity.vector));
        let collisionType = this.detectMapCollision(entity, entityHb);
        if (collisionType === "edge" || collisionType === "offroad") {
            if (isDiagonal(entity.Velocity.prevVector)) {
                entity.Velocity.altVectors.push(entity.Velocity.prevVector);
            }
            do {
                // this.revert(entity);
                let moved = this.revertToValidPosition(entity, "map");
                if (moved)
                    break;
                if (!entity.Velocity.altVectors.length)
                    break;
                if (entity.Velocity.altVectors.length > 1 &&
                    this.playerCollisionVertices.length === 1 &&
                    isDiagonal(entity.Velocity.vector)) {
                    this.prioritizeAltVectors(entity, entityHb);
                }
                this.playerCollisionVertices = [];
                entity.Velocity.vector = entity.Velocity.altVectors.shift();
                this.move(entity);
                entityHb = entity.Collision.currentHb(findDegFromVector(entity.Velocity.vector));
                collisionType = this.detectMapCollision(entity, entityHb);
            } while (collisionType === "edge" || collisionType === "offroad");
        }
        if (collisionType === "schoolZone") {
            if (!entity.SchoolZone) {
                entity.addComponent("SchoolZone", { multiplier: 0.34 });
            }
        }
        else {
            if (entity.SchoolZone) {
                entity.removeComponentByType("SchoolZone");
            }
        }
        if (collisionType === "office") {
            if (entity.id === "player")
                this._game.publish("raceFinished", "won");
            else if (entity.id === "boss")
                this._game.publish("raceFinished", "lost");
        }
        return collisionType;
    }
    detectMapCollision(entity, hb) {
        let x = entity.Coordinates.X;
        let y = entity.Coordinates.Y;
        let v = entity.Velocity.vector;
        // let deg = findDegFromVector(v);
        // let hb = entity.Collision.currentHb(deg);
        let thb = [];
        if (this.checkEdgeCollision(hb)) {
            return "edge";
        }
        else {
            let schoolZone = false;
            let surrounding = this.map.getSurroundingSquares(x, y, 2);
            for (let square of surrounding) {
                if (!square)
                    continue;
                let sqCoords = square.coordinates;
                thb = getTileHitbox(sqCoords.X, sqCoords.Y, 25, 25);
                if (!square.drivable) {
                    //check only front vertices for collision
                    if (this.checkFrontOnlyCollision(hb, thb))
                        return "offroad";
                }
                else if (checkCollision(hb, thb)) {
                    if (square.id == this.map.office)
                        return "office";
                    if (square.schoolZone)
                        schoolZone = true;
                }
            }
            if (schoolZone)
                return "schoolZone";
        }
        return "";
    }
    checkValidDiagonalMove(entity, thb) {
        let cp = entity.Collision.currentCp();
        let w = entity.Renderable.renderW;
        let h = entity.Renderable.renderH;
        let downLimit = { X: cp.X, Y: cp.Y + w / 2 };
        let upLimit = { X: cp.X, Y: cp.Y - w / 2 };
        let leftLimit = { X: cp.X - w / 2, Y: cp.Y };
        let rightLimit = { X: cp.X + w / 2, Y: cp.Y };
        return true;
    }
    checkEdgeCollision(hb) {
        let mw = this.map.pixelWidth;
        let mh = this.map.pixelHeight;
        for (let { X, Y } of hb) {
            if (X < 0 || Y < 0 || X > mw || Y > mh)
                return true;
        }
        return false;
    }
    checkFrontOnlyCollision(hb, thb) {
        let frontL = hb[0];
        let frontR = hb[1];
        let collision = false;
        let flhit = checkPointCollision(thb, frontL.X, frontL.Y);
        if (flhit) {
            this.playerCollisionVertices.push({ X: frontL.X, Y: frontL.Y });
            collision = true;
        }
        let frhit = checkPointCollision(thb, frontR.X, frontR.Y);
        if (frhit) {
            this.playerCollisionVertices.push({ X: frontR.X, Y: frontR.Y });
            collision = true;
        }
        return collision;
    }
    checkTileCollision(x1, y1, x2, y2, w1 = 25, h1 = 25, w2 = 25, h2 = 25) {
        if (x1 + w1 >= x2 && x1 <= x2 + w2 && y1 + h1 >= y2 && y2 <= y2 + h2) {
            return true;
        }
        return false;
    }
    handleEntityCollisions(entity) {
        let collisions = this.detectEntityCollisions(entity);
        let outcome = "";
        for (let c of collisions) {
            if (c.has("Car") && this._game.mode !== "lost") {
                this._game.publish("raceFinished", "crash");
                outcome = "car";
                break;
            }
            if (c.has("Timer") && c.has("Color") && c.Color.color === "red") {
                //if car is moving AND if car's pre-move location is NOT colliding with the light, then stop car
                if (this.checkForValidLightCollision(entity, c)) {
                    this._game.publish("redLight", entity, c);
                    // this.revert(entity);
                    this.revertToValidPosition(entity, "entity");
                    outcome = "redLight";
                    break;
                }
            }
            if (c.has("Caffeine")) {
                this._game.publish("caffeinate", entity, c);
                this.collidables = this.collidables.filter((e) => e !== c);
                outcome = "coffee";
            }
        }
        return outcome;
    }
    detectEntityCollisions(entity) {
        let v = entity.Velocity.vector;
        let deg = findDegFromVector(v);
        let hb = entity.Collision.currentHb(deg);
        return this.collidables.filter((c) => {
            if (entity === c)
                return false;
            let chb = c.Collision.currentHb();
            if (c.has("Timer") && c.has("Color"))
                return this.checkFrontOnlyCollision(hb, chb);
            else
                return checkCollision(hb, chb);
        });
    }
    checkForValidLightCollision(entity, lightEntity) {
        let { X, Y } = entity.Velocity.vector;
        if (X === 0 && Y === 0)
            return false;
        let prevCollision = this.checkFrontOnlyCollision(entity.Collision.prevHb, lightEntity.Collision.currentHb());
        return !prevCollision;
    }
    getPreviousCoordinate(x, y, vx, vy, s) {
        return {
            X: x - vx * s,
            Y: y - vy * s,
        };
    }
    prioritizeAltVectors(entity, hb) {
        console.log("Running prioritzeAltVectors");
        let { Velocity } = entity;
        // let hb = entity.Collision.currentHb(findDegFromVector(Velocity.vector));
        //if X is positive, then the hb's front vertex with the higher X value is the furthest horizontal coordinate in the direction of travel
        //else, the vertex with the lower X value is
        let determiner = Velocity.vector.X > 0
            ? (a, b) => {
                return b.X - a.X;
            }
            : (a, b) => {
                return a.X - b.X;
            };
        let vertex = [hb[0], hb[1]].sort(determiner)[0];
        //if the "most horizontal" vertex is the one causing the collision, swap the next two alt vectors in the queue
        //this will prioritize the vertical alt vector over the horizontal one
        let collisionVertex = JSON.stringify(this.playerCollisionVertices[0]);
        let horizontalestVertext = JSON.stringify(vertex);
        if (collisionVertex === horizontalestVertext) {
            console.log("REPRIORITIZING VERTICES!!");
            let leftOrRight = Velocity.altVectors[0];
            let upOrDown = Velocity.altVectors[1];
            Velocity.altVectors[0] = upOrDown;
            Velocity.altVectors[1] = leftOrRight;
        }
    }
    updateHitbox(entity) {
        let { hb, cp } = entity.Collision;
        let c = entity.Coordinates;
        hb = hb.map((v) => ({ X: v.X + c.X, Y: v.Y + c.Y }));
        let cpx = cp.X + c.X;
        let cpy = cp.Y + c.Y;
        let deg = entity.Renderable.degrees;
        if (deg === 0)
            return hb;
        //@ts-ignore
        return hb.map(({ X, Y }) => findRotatedVertex(X, Y, cpx, cpy, deg));
    }
    move(entity) {
        const speedConstant = calculateSpeedConstant(entity);
        entity.Coordinates.X += entity.Velocity.vector.X * speedConstant;
        entity.Coordinates.Y += entity.Velocity.vector.Y * speedConstant;
        // let deg = findDegFromVector(entity.Velocity.vector);
        // if (deg >= 0) entity.Renderable.degrees = deg;
    }
    revert(entity) {
        const speedConstant = calculateSpeedConstant(entity);
        let { X, Y } = this.getPreviousCoordinate(entity.Coordinates.X, entity.Coordinates.Y, entity.Velocity.vector.X, entity.Velocity.vector.Y, speedConstant);
        entity.Coordinates.X = X;
        entity.Coordinates.Y = Y;
        if (entity.Velocity.prevVector)
            entity.Velocity.vector = entity.Velocity.prevVector;
        // entity.Velocity.prevVector = null;
        // let deg = findDegFromVector(entity.Velocity.vector);
        // if (deg >= 0) entity.Renderable.degrees = deg;
        // entity.Velocity.vector.X = 0;
        // entity.Velocity.vector.Y = 0;
    }
    revertToValidPosition(entity, collisionType) {
        let { Coordinates, Velocity } = entity;
        // if (entity.has("SchoolZone")) debugger;
        const speedConstant = calculateSpeedConstant(entity);
        let prevCoord = this.getPreviousCoordinate(Coordinates.X, Coordinates.Y, Velocity.vector.X, Velocity.vector.Y, speedConstant);
        let revertDistance = 0;
        let moved = false;
        // if (speedConstant >= 25) debugger;
        do {
            revertDistance++;
            let backOne = this.getPreviousCoordinate(Coordinates.X, Coordinates.Y, Velocity.vector.X, Velocity.vector.Y, 1);
            Coordinates.X = backOne.X;
            Coordinates.Y = backOne.Y;
            if (collisionType === "map") {
                if (!this.detectMapCollision(entity, entity.Collision.currentHb(findDegFromVector(Velocity.vector)))) {
                    if (revertDistance < speedConstant)
                        moved = true;
                    break;
                }
            }
            else if (collisionType === "entity")
                if (!this.detectEntityCollisions(entity).length) {
                    if (revertDistance < speedConstant)
                        moved = true;
                    break;
                }
        } while ((Coordinates.X !== prevCoord.X || Coordinates.Y !== prevCoord.Y) &&
            revertDistance < speedConstant);
        // if (revertDistance > 1 && revertDistance < speedConstant) moved = true;
        if (!moved && entity.Velocity.prevVector)
            entity.Velocity.vector = entity.Velocity.prevVector;
        return moved;
    }
}
CollisionSystem.query = {
    has: ["Collision", "Coordinates", "Renderable"],
};
CollisionSystem.subscriptions = ["Coordinates"];
