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


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new value field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ValueField.IOptions<T>) {
    this.defaultValue = options.defaultValue;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'value' {
    return 'value';
  }

  /**
   * The default value for the field.
   */
  readonly defaultValue: T;

  /**
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': T;

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': T;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ValueField.IChange<T>;
}


/**
 * The namespace for the `ValueField` class statics.
 */
export
namespace ValueField {
  /**
   * An options object for initializing a value field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> {
    /**
     * The default value for the field.
     */
    defaultValue: T;
  }

  /**
   * The change type for a value field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The old value of the field.
     */
    oldValue: T;

    /**
     * The new value of the field.
     */
    newValue: T;
  }
}
