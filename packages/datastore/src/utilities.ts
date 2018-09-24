/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Create a duplex string identifier.
 *
 * @param version - The datastore version for the duplex id.
 *
 * @param store - The datastore id for the duplex id.
 *
 * @returns A string duplex id for the given arguments.
 */
export
function createDuplexId(version: number, store: number): string {
  // Split the version into 16-bit values.
  let vc = version & 0xFFFF;
  let vb = (((version - vc) / 0x10000) | 0) & 0xFFFF;
  let va = (((version - vb - vc) / 0x100000000) | 0) & 0xFFFF;

  // Split the store id into 16-bit values.
  let sb = store & 0xFFFF;
  let sa = (((store - sb) / 0x10000) | 0) & 0xFFFF;

  // Convert the parts into a string identifier duplex.
  return String.fromCharCode(va, vb, vc, sa, sb);
}



// /**
//    * A class which manages the id tombstones for a list.
//    */
//   export
//   class Cemetery {
//     /**
//      * Get a copy of the raw data for a cemetery.
//      *
//      * @returns A new copy of the raw internal data.
//      */
//     data(): { [id: string]: number } {
//       return { ...this._data };
//     }

//     /**
//      * Assign raw data to the cemetery.
//      *
//      * @param data - The raw data to apply to the cemetery.
//      */
//     assign(data: { readonly [id: string]: number }): void {
//       this._data = { ...data };
//     }

//     /**
//      * Get the tombstone count for an identifier.
//      *
//      * @param id - The identifier of interest.
//      *
//      * @returns The tombstone count for the identifier `>= 0`.
//      */
//     get(id: string): number {
//       return this._data[id] || 0;
//     }

//     /**
//      * Set the tombstone count for an identifier.
//      *
//      * @param id - The identifier of interest.
//      *
//      * @parm count - The tombstone count `>= 0`.
//      */
//     set(id: string, count: number): void {
//       if (count === 0) {
//         delete this._data[id];
//       } else {
//         this._data[id] = count;
//       }
//     }

//     private _data: { [id: string]: number } = {};
//   }


// /**
//  * The namespace for the module implementation details.
//  */
// namespace Private {
//   /**
//    * Create an identifier between two boundary identifiers.
//    *
//    * @param lower - The lower boundary identifier, exclusive, or an
//    *   empty string if there is no lower boundary.
//    *
//    * @param upper - The upper boundary identifier, exclusive, or an
//    *   empty string if there is no upper boundary.
//    *
//    * @param clock - The store clock for the identifier.
//    *
//    * @param store - The store id for the identifier.
//    *
//    * @returns An identifier which sorts between the given boundaries.
//    *
//    * #### Undefined Behavior
//    * A `lower` or `upper` boundary identifier which is malformed or
//    * which is badly ordered.
//    */
//   export
//   function createId(lower: string, upper: string, clock: number, store: number): string {
//     // Set up the variable to hold the id.
//     let id = '';

//     // Fetch the triplet counts of the ids.
//     let lowerCount = lower ? idTripletCount(lower) : 0;
//     let upperCount = upper ? idTripletCount(upper) : 0;

//     // Iterate over the id triplets.
//     for (let i = 0, n = Math.max(lowerCount, upperCount); i < n; ++i) {
//       // Fetch the lower identifier triplet, padding as needed.
//       let lp: number;
//       let lc: number;
//       let ls: number;
//       if (i >= lowerCount) {
//         lp = 0;
//         lc = 0;
//         ls = 0;
//       } else {
//         lp = idPathAt(lower, i);
//         lc = idClockAt(lower, i);
//         ls = idStoreAt(lower, i);
//       }

//       // Fetch the upper identifier triplet, padding as needed.
//       let up: number;
//       let uc: number;
//       let us: number;
//       if (i >= upperCount) {
//         up = upperCount === 0 ? MAX_PATH + 1 : 0;
//         uc = 0;
//         us = 0;
//       } else {
//         up = idPathAt(upper, i);
//         uc = idClockAt(upper, i);
//         us = idStoreAt(upper, i);
//       }

//       // If the triplets are the same, copy the triplet and continue.
//       if (lp === up && lc === uc && ls === us) {
//         id += createTriplet(lp, lc, ls);
//         continue;
//       }

//       // If the triplets are different, the well-ordered identifiers
//       // assumption means that the lower triplet compares less than
//       // the upper triplet. The task now is to find the nearest free
//       // path slot among the remaining triplets.

//       // If there is free space between the path portions of the
//       // triplets, select a new path which falls between them.
//       if (up - lp > 1) {
//         let np = randomPath(lp + 1, up - 1);
//         id += createTriplet(np, clock, store);
//         return id.slice();
//       }

//       // Otherwise, copy the left triplet and reset the upper count
//       // to zero so that the loop chooses the nearest available path
//       // slot after the current lower triplet.
//       id += createTriplet(lp, lc, ls);
//       upperCount = 0;
//     }

//     // If this point is reached, the lower and upper identifiers share
//     // the same path but diverge based on the clock or store id. It is
//     // safe to insert anywhere after the lower path.
//     let np = randomPath(1, MAX_PATH);
//     id += createTriplet(np, clock, store);
//     return id.slice();
//   }

//   // ID format: <6-byte path><6-byte version><4-byte storeId>...
//   //            = 16bytes per triplet
//   //            = 8 16-bit chars per triplet

//   /**
//    * The maximum allowed path value in an identifier.
//    */
//   const MAX_PATH = 0xFFFFFFFFFFFF;

//   /**
//    * Create a string identifier triplet.
//    *
//    * @param path - The path value for the triplet.
//    *
//    * @param clock - The clock value for the triplet.
//    *
//    * @param store - The store id for the triplet.
//    */
//   function createTriplet(path: number, clock: number, store: number): string {
//     // Split the path into 16-bit values.
//     let pc = path & 0xFFFF;
//     let pb = (((path - pc) / 0x10000) | 0) & 0xFFFF;
//     let pa = (((path - pb - pc) / 0x100000000) | 0) & 0xFFFF;

//     // Split the clock into 16-bit values.
//     let cc = clock & 0xFFFF;
//     let cb = (((clock - cc) / 0x10000) | 0) & 0xFFFF;
//     let ca = (((clock - cb - cc) / 0x100000000) | 0) & 0xFFFF;

//     // Split the store id into 16-bit values.
//     let sb = store & 0xFFFF;
//     let sa = (((store - sb) / 0x10000) | 0) & 0xFFFF;

//     // Convert the parts into a string identifier triplet.
//     return String.fromCharCode(pa, pb, pc, ca, cb, cc, sa, sb);
//   }

//   /**
//    * Get the total number of path triplets in an identifier.
//    *
//    * @param id - The identifier of interest.
//    *
//    * @returns The total number of triplets in the id.
//    */
//   function idTripletCount(id: string): number {
//     return id.length >> 3;
//   }

//   /**
//    * Get the path value for a particular triplet.
//    *
//    * @param id - The string id of interest.
//    *
//    * @param i - The index of the triplet.
//    *
//    * @returns The path value for the specified triplet.
//    */
//   function idPathAt(id: string, i: number): number {
//     let j = i << 3;
//     let a = id.charCodeAt(j + 0);
//     let b = id.charCodeAt(j + 1);
//     let c = id.charCodeAt(j + 2);
//     return a * 0x100000000 + b * 0x10000 + c;
//   }

//   /**
//    * Get the clock value for a particular triplet.
//    *
//    * @param id - The identifier of interest.
//    *
//    * @param i - The index of the triplet.
//    *
//    * @returns The clock value for the specified triplet.
//    */
//   function idClockAt(id: string, i: number): number {
//     let j = i << 3;
//     let a = id.charCodeAt(j + 3);
//     let b = id.charCodeAt(j + 4);
//     let c = id.charCodeAt(j + 5);
//     return a * 0x100000000 + b * 0x10000 + c;
//   }

//   /**
//    * Get the store id for a particular triplet.
//    *
//    * @param id - The identifier of interest.
//    *
//    * @param i - The index of the triplet.
//    *
//    * @returns The store id for the specified triplet.
//    */
//   function idStoreAt(id: string, i: number): number {
//     let j = i << 3;
//     let a = id.charCodeAt(j + 6);
//     let b = id.charCodeAt(j + 7);
//     return a * 0x10000 + b;
//   }

//   /**
//    * Pick a path in the leading bucket of an inclusive range.
//    *
//    * @param min - The minimum allowed path, inclusive.
//    *
//    * @param max - The maximum allowed path, inclusive.
//    *
//    * @returns A random path in the leading bucket of the range.
//    */
//   function randomPath(min: number, max: number): number {
//     return min + Math.round(Math.random() * Math.sqrt(max - min));
//   }
// }
