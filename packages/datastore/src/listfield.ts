/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  IList
} from './list';


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new list field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ListField.IOptions<T> = {}) {
    this.defaultValue = options.defaultValue || [];
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: ReadonlyArray<T>;

  /**
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': ReadonlyArray<T>;

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': IList<T>;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ReadonlyArray<ListField.IChange<T>>;
}


/**
 * The namespace for the `ListField` class statics.
 */
export
namespace ListField {
  /**
   * An options object for initializing a list field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> {
    /**
     * The default value for the field.
     *
     * The default is an empty array.
     */
    defaultValue?: ReadonlyArray<T>;
  }

  /**
   * The change type for a list field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The values removed at the given index.
     */
    readonly removedValues: ReadonlyArray<T>;

    /**
     * The values inserted at the given index.
     */
    readonly insertedValues: ReadonlyArray<T>;
  }
}
