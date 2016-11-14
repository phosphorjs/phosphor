/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Iterable, iter
} from './iterable';


/**
 * Find the first value in an iterable which matches a predicate.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @returns The first matching value, or `undefined` if no matching
 *   value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { find } from '@phosphor/algorithm';
 *
 * interface IAnimal { species: string, name: string };
 *
 * function isCat(value: IAnimal): boolean {
 *   return value.species === 'cat';
 * }
 *
 * let data: IAnimal[] = [
 *   { species: 'dog', name: 'spot' },
 *   { species: 'cat', name: 'fluffy' },
 *   { species: 'alligator', name: 'pocho' }
 * ];
 *
 * find(data, isCat).name;  // 'fluffy'
 * ```
 */
export
function find<T>(object: Iterable<T>, fn: (value: T, index: number) => boolean): T {
  let value: T;
  let index = 0;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    if (fn(value, index++)) {
      return value;
    }
  }
  return void 0;
}
