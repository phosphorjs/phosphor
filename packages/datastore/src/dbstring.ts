/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal
} from '@phosphor/signaling';

import {
  IDBObject
} from './dbobject';


/**
 * A db object which holds a string.
 */
export
interface IDBString extends IDBObject {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<this, IDBString.ChangedArgs>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'string';

  /**
   * Whether the string is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the string.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * Get the value of the db string.
   *
   * @returns The current string value.
   */
  get(): string;

  /**
   * Set the value of the db string.
   *
   * @param value - The desired value for the string.
   */
  set(value: string): void;

  /**
   * Add text to the end of the string.
   *
   * @param value - The text to add to the end of the string.
   */
  append(value: string): void;

  /**
   * Insert text into the string.
   *
   * @param index - The index at which to insert the text.
   *
   * @param value - The text to insert into the string.
   */
  insert(index: number, value: string): void;

  /**
   * Replace a range of text in the string.
   *
   * @param index - The index of the first character to be removed.
   *   Negative values are offset from the end of the string.
   *
   * @param count - The number of characters to remove.
   *
   * @param value - The text to insert at the specified index.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, value?: string): void;

  /**
   * Clear the string.
   */
  clear(): void;
}


/**
 * The namespace for the `IDBString` interface statics.
 */
export
namespace IDBString {
  /**
   * The type of the db string changed arguments.
   */
  export
  type ChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'string:changed';

    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text that was removed from the string.
     */
    readonly removed: string;

    /**
     * The text that was added to the string.
     */
    readonly added: string;
  };
}
