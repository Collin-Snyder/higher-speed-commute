"use strict";
// import { IMapObject, ISquare, Square } from "./state/map";
// const testLayout: any[] = [];
// export const addBordersBack = (layout: any[]) => {
//   for (let square of layout) {
//     for (let direction in square.borders) {
//       if (square.borders[direction] !== null) {
//         let borderId = square.borders[direction];
//         square.borders[direction] = layout[borderId - 1];
//       }
//     }
//   }
//   return layout;
// };
// const lights = {
//   "190": 10000,
//   "258": 9000,
//   "285": 5000,
//   "437": 7000,
//   "470": 12000,
//   "532": 4000,
//   "766": 11000,
//   "915": 4000,
// };
// const coffees = {};
// export const convertToMapObjectSquares = (bigLayout: any[]) => {
//   let formattedLayout = bigLayout.map((s) => {
//     let idNum = Number(s.id);
//     let square: ISquare = new Square(
//       s.id,
//       Math.ceil(idNum / 40),
//       Math.floor(idNum % 40) > 0 ? Math.floor(idNum % 40) : 40
//     );
//     square.borders = s.borders;
//     square.drivable = s.type === "street";
//     square.schoolZone = s.schoolZone;
//     return square;
//   });
//   return addBordersBack(formattedLayout);
// };
// const testMapObject: IMapObject = {
//   height: 25,
//   width: 40,
//   playerHome: 281,
//   bossHome: 681,
//   office: 520,
//   lights,
//   coffees,
//   squares: convertToMapObjectSquares(testLayout),
// };
// export default testMapObject;
// // const prettify = (layout) => {
// //   for (let square of layout) {
// //     if (Math.random() < 0.4 && !square.tile) {
// //       square.tile = "tree";
// //     }
// //     if (Math.random() < 0.3 && !square.tile) {
// //       let valid = false;
// //       for (let border in square.borders) {
// //         if (
// //           square.borders[border] &&
// //           square.borders[border].tile === "street"
// //         ) {
// //           valid = true;
// //           break;
// //         }
// //       }
// //       if (valid) square.tile = "house";
// //     }
// //   }
// //   return layout;
// // };
// // const testMap = prettify(formatLayout(testLayout));
// // let num = 0;
// // let start = new Date().getTime();
// // for (let i = 1; i <= 1000000000; i++) {
// //   num = i + 1;
// // }
// // let end = new Date().getTime();
// // console.log(`It took ${end - start}ms to count to ${num - 1}`);
// const times = function(cb, index) {
//   let num = parseInt(this);
//   if (index !== 0 && index !== 1) index = 0;
//   for (let i = 0; i < num; i++) {
//     cb(index ? i + 1 : i);
//   }
// };
