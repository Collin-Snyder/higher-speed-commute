function calculateSpeedConstant(entity) {
    let speed = entity.Velocity.speedConstant;
    if (entity.has("SchoolZone")) {
        return speed * entity.SchoolZone.multiplier;
    }
    if (entity.has("CaffeineBoost")) {
        for (let cb of entity.CaffeineBoost) {
            speed *= cb.multiplier;
        }
    }
    return speed;
}
function canHasFudge(x1, y1, x2, y2, fudge) {
    return abs(x2 - x1) <= fudge && abs(y2 - y1) <= fudge;
}
function normalize(vectors) {
    let megaVector = vectors.reduce((acc, v) => {
        return { X: acc.X + v.X, Y: acc.Y + v.Y };
    }, { X: 0, Y: 0 });
    let { X, Y } = megaVector;
    let hyp = Math.sqrt(X * X + Y * Y);
    let scale = 1 / hyp;
    return { X: X * scale, Y: Y * scale };
}
function checkVelocityZero(v) {
    return v.X === 0 && v.Y === 0;
}
function calculateSurroundingSquareCount(layers) {
    let total = 0;
    while (layers > 0) {
        total += layers * 8;
        layers--;
    }
    return total;
}
function average(nums) {
    let sum = nums.reduce((sum, n) => n + sum);
    return sum / nums.length;
}
function checkForMouseCollision(mx, my, ex, ey, ew, eh) {
    return mx >= ex && my >= ey && mx <= ex + ew && my <= ey + eh;
}
function findCenteredElementSpread(p, e, n, style, c) {
    //requires that elements have uniform dimension - either height or width
    //p is parent dimension - either the width or height of containing element, depending on if centering horizontally or vertically
    //e is element dimension - either width or height of elements to be centered
    //n is number of elements to be arranged
    //c is container dimension - if it's present, center elements according to container and adjust to center container within parent element
    let output = { start: 0, step: 0 };
    let container = c ? (c < p ? c : p) : p;
    let total = n * e;
    if (total > container) {
        // console.log(
        //   "You are trying to place too many elements into too small of a container."
        // );
        return output;
    }
    let space = container - total;
    if (style === "spaceBetween") {
        output.step = space / (n - 1);
    }
    else if (style === "spaceEvenly") {
        output.step = space / (n + 1);
        output.start = output.step;
    }
    output.step += e;
    if (c && c < p) {
        let cStart = (p - c) / 2;
        output.start += cStart;
    }
    output.start = Math.floor(output.start);
    output.step = Math.floor(output.step);
    return output;
}
function randomNumBtwn(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function isPositionable(entity) {
    if (!entity.has("Coordinates")) {
        console.log(`Entity ${entity.id} does not have a Coordinates component and cannot be aligned.`);
        return false;
    }
    if (!entity.has("Renderable")) {
        console.log(`Entity ${entity.id} does not have a Renderable component and cannot be aligned.`);
        return false;
    }
    return true;
}
function calculateXForAlignItems(e, cx, cw, horizontalAlignment) {
    let x = cx;
    if (horizontalAlignment === "left")
        return x;
    if (horizontalAlignment === "right") {
        x = cx + e.Coordinates.X + cw - e.Renderable.renderW;
    }
    else {
        x = cx + e.Coordinates.X + cw / 2 - e.Renderable.renderW / 2;
    }
    return x;
}
function calculateYForJustifyItems(e, cy, ch, verticalJustify) {
    let y = cy;
    if (verticalJustify === "top")
        return y;
    if (verticalJustify === "bottom") {
        y = cy + e.Coordinates.Y + ch - e.Renderable.renderH;
    }
    else {
        y = cy + e.Coordinates.Y + ch / 2 - e.Renderable.renderH / 2;
    }
    return y;
}
function alignCenter(cx, cy, cw, ch, ew, eh) {
    let x = cw / 2 - ew / 2 + cx;
    let y = ch / 2 - eh / 2 + cy;
    return { x, y };
}
function alignItems(cx, cy, cw, ch, entities, verticalAlignment, horizontalAlignment = "center", padding = 0) {
    let aligned = [];
    switch (verticalAlignment) {
        case "top":
            aligned = alignTop(cx, cy, cw, entities, padding, horizontalAlignment);
            break;
        case "bottom":
            aligned = alignBottom(cx, cy, cw, ch, entities, padding, horizontalAlignment);
            break;
        case "spaceEvenly":
        case "spaceBetween":
        default:
            aligned = alignSpaced(cx, cy, cw, ch, entities, verticalAlignment, horizontalAlignment);
    }
    return aligned;
}
function alignTop(cx, cy, cw, entities, padding, horizontalAlignment) {
    const aligned = [];
    let currentY = cy;
    for (let entity of entities) {
        if (Array.isArray(entity)) {
            //justifyItems
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.X = calculateXForAlignItems(entity, cx, cw, horizontalAlignment);
            Coordinates.Y = currentY;
            currentY += Renderable.renderH + padding;
            aligned.push(entity);
        }
    }
    return aligned;
}
function alignBottom(cx, cy, cw, ch, entities, padding, horizontalAlignment) {
    let aligned = [];
    let currentY = cy + ch;
    for (let i = entities.length - 1; i >= 0; i--) {
        let entity = entities[i];
        if (Array.isArray(entity)) {
            //justifyItems
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.X = calculateXForAlignItems(entity, cx, cw, horizontalAlignment);
            Coordinates.Y = currentY - Renderable.renderH;
            currentY -= padding;
            aligned.push(entity);
        }
    }
    return aligned;
}
function alignSpaced(cx, cy, cw, ch, entities, spacing = "spaceEvenly", horizontalAlignment) {
    const aligned = [];
    let currentY = cy;
    let padding = 0;
    let totalEntityH = entities.reduce((sum, e) => {
        let newSum = sum;
        if (Array.isArray(e)) {
            newSum += max(...e.map((e) => (isPositionable(e) ? e.Renderable.renderH : 0)));
        }
        else {
            newSum += isPositionable(e) ? e.Renderable.renderH : 0;
        }
        return newSum;
    }, 0);
    // if (!isPositionable(entity)) continue;
    let space = ch - totalEntityH;
    padding =
        spacing === "spaceEvenly"
            ? space / (entities.length + 1)
            : space / (entities.length - 1);
    if (spacing === "spaceBetween") {
        padding = space / (entities.length - 1);
    }
    else {
        padding = space / (entities.length + 1);
        currentY += padding;
    }
    for (let entity of entities) {
        if (Array.isArray(entity)) {
            //justify items
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.X = calculateXForAlignItems(entity, cx, cw, horizontalAlignment);
            Coordinates.Y = currentY;
            currentY += Renderable.renderH + padding;
            aligned.push(entity);
        }
    }
    return aligned;
}
function justifyItems(cx, cy, cw, ch, entities, horizontalJustify, verticalJustify = "center", padding = 0) {
    let justified = [];
    switch (horizontalJustify) {
        case "left":
            justified = justifyLeft(cx, cy, ch, entities, padding, verticalJustify);
            break;
        case "right":
            justified = justifyRight(cx, cy, cw, ch, entities, padding, verticalJustify);
            break;
        case "spaceEvenly":
        case "spaceBetween":
        default:
            justified = justifySpaced(cx, cy, cw, ch, entities, horizontalJustify, verticalJustify);
    }
    return justified;
}
function justifyLeft(cx, cy, ch, entities, padding, verticalJustify) {
    let justified = [];
    let currentX = cx;
    for (let entity of entities) {
        if (Array.isArray(entity)) {
            //justified.push(...alignItems(currentX))
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.Y = calculateYForJustifyItems(entity, cy, ch, verticalJustify);
            Coordinates.X = currentX;
            currentX += Renderable.renderW + padding;
            justified.push(entity);
        }
    }
    return justified;
}
function justifyRight(cx, cy, cw, ch, entities, padding, verticalJustify) {
    let justified = [];
    let currentX = cx + cw;
    for (let i = entities.length - 1; i >= 0; i--) {
        let entity = entities[i];
        if (Array.isArray(entity)) {
            //justifyItems
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.Y = calculateYForJustifyItems(entity, cy, ch, verticalJustify);
            Coordinates.X = currentX - Renderable.renderW;
            currentX -= padding;
            justified.push(entity);
        }
    }
    return justified;
}
function justifySpaced(cx, cy, cw, ch, entities, spacing, verticalJustify) {
    const justified = [];
    let currentX = cx;
    let padding = 0;
    let totalEntityW = entities.reduce((sum, e) => {
        let newSum = sum;
        if (Array.isArray(e)) {
            newSum += max(...e.map((e) => (isPositionable(e) ? e.Renderable.renderW : 0)));
        }
        else {
            newSum += isPositionable(e) ? e.Renderable.renderW : 0;
        }
        return newSum;
    }, 0);
    // if (!isPositionable(entity)) continue;
    let space = cw - totalEntityW;
    padding =
        spacing === "spaceEvenly"
            ? space / (entities.length + 1)
            : space / (entities.length - 1);
    if (spacing === "spaceBetween") {
        padding = space / (entities.length - 1);
    }
    else {
        padding = space / (entities.length + 1);
        currentX += padding;
    }
    for (let entity of entities) {
        if (Array.isArray(entity)) {
            //justify items
        }
        else {
            if (!isPositionable(entity))
                continue;
            let { Coordinates, Renderable } = entity;
            Coordinates.Y = calculateYForJustifyItems(entity, cy, ch, verticalJustify);
            Coordinates.X = currentX;
            currentX += Renderable.renderW + padding;
            justified.push(entity);
        }
    }
    return justified;
}
function centerWithin(cx, cy, cw, ch, ew, eh, n, dir, style = "spaceEvenly") {
    let x = findCenteredElementSpread(cw, ew, dir === "horizontal" ? n : 1, dir === "horizontal" ? style : "spaceEvenly");
    let y = findCenteredElementSpread(ch, eh, dir === "vertical" ? n : 1, dir === "vertical" ? style : "spaceEvenly");
    x.start += cx;
    y.start += cy;
    // let x = dir === "horizontal" ? horiz : horiz.start;
    // let y = dir === "vertical" ? vert : vert.start;
    return { x, y };
}
function getCenterPoint(x, y, w, h) {
    return { X: x + w / 2, Y: y + h / 2 };
}
function degreesToRadians(deg) {
    return (deg * Math.PI) / 180;
}
function radiansToDegrees(rad) {
    return (rad * 180) / Math.PI;
}
function scaleVector(v, s) {
    return { X: v.X * s, Y: v.Y * s };
}
function multiplyVectors(v1, v2) {
    return { X: v1.X * v2.X, Y: v1.Y * v2.Y };
}
function subtractVectors(v1, v2) {
    return { X: v2.X - v1.X, Y: v2.Y - v1.Y };
}
function isDiagonal(v) {
    if (!v)
        return false;
    let { X, Y } = v;
    if (X !== 0 && Y !== 0)
        return true;
    return false;
}
function isStopped(v) {
    console.log(v);
    let { X, Y } = v;
    if (X === 0 && Y === 0)
        return true;
    return false;
}
function dotProd(v1, v2) {
    return v1.X * v2.X + v1.Y * v2.Y;
}
function findDegFromVector(v) {
    const { X, Y } = v;
    if (X === 0 && Y === 0)
        return -1;
    if (X > 0 && Y < 0)
        return 45;
    if (X > 0 && Y > 0)
        return 135;
    if (X < 0 && Y > 0)
        return 225;
    if (X < 0 && Y < 0)
        return 315;
    if (Y < 0)
        return 0;
    if (X > 0)
        return 90;
    if (Y > 0)
        return 180;
    if (X < 0)
        return 270;
    return -1;
}
function findRotatedVertex(vx, vy, cx, cy, d) {
    let r = degreesToRadians(d);
    let cr = cos(r);
    let sr = sin(r);
    //use cp to translate vx and vy to origin
    let ox = vx - cx;
    let oy = vy - cy;
    //new x = ox * cos(r) - oy * sin(r)
    //new y = oy * cos(r) + ox * sin(r)
    let nx = ox * cr - oy * sr;
    let ny = oy * cr + ox * sr;
    //use cp to translate new x and y back from origin
    let X = nx + cx;
    let Y = ny + cy;
    //return new vertex
    return { X, Y };
}
function getTileHitbox(x, y, w, h) {
    return [
        { X: x, Y: y },
        { X: x + w, Y: y },
        { X: x + w, Y: y + h },
        { X: x, Y: y + h },
    ];
}
function checkCollision(hb1, hb2) {
    let next = 0;
    for (let curr = 0; curr < hb1.length; curr++) {
        next = curr + 1;
        if (next === hb1.length)
            next = 0;
        let vc = hb1[curr];
        let vn = hb1[next];
        let collision = checkSideCollision(hb2, vc.X, vc.Y, vn.X, vn.Y);
        if (collision)
            return true;
        collision = checkPointCollision(hb2, hb1[0].X, hb1[0].Y);
        if (collision)
            return true;
    }
    return false;
}
function checkSideCollision(hb, x1, y1, x2, y2) {
    let next = 0;
    for (let curr = 0; curr < hb.length; curr++) {
        next = curr + 1;
        if (next === hb.length)
            next = 0;
        let x3 = hb[curr].X;
        let y3 = hb[curr].Y;
        let x4 = hb[next].X;
        let y4 = hb[next].Y;
        let hit = checkLineCollision(x1, y1, x2, y2, x3, y3, x4, y4);
        if (hit)
            return hit;
    }
    return false;
}
function checkLineCollision(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denominator === 0)
        return false;
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1)
        return false;
    let X = x1 + ua * (x2 - x1);
    let Y = y1 + ua * (y2 - y1);
    return { X, Y };
}
function checkPointCollision(hb, px, py) {
    let collision = false;
    let next = 0;
    for (let curr = 0; curr < hb.length; curr++) {
        next = curr + 1;
        if (next === hb.length)
            next = 0;
        let vc = hb[curr];
        let vn = hb[next];
        if (((vc.Y > py && vn.Y < py) || (vc.Y < py && vn.Y > py)) &&
            px < ((vn.X - vc.X) * (py - vc.Y)) / (vn.Y - vc.Y) + vc.X) {
            collision = !collision;
        }
    }
    return collision;
}
