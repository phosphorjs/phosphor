/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  IList, IMap, IText
} from './containers';


/**
 * An abstract base class for framework-defined fields.
 *
 * #### Notes
 * A data store does not support user-defined fields.
 */
export
abstract class BaseField<UpdateType, RuntimeType, ChangeType> {
  /**
   * Construct a new base field.
   */
  constructor(options: BaseField.IOptions = {}) {
    let { synchronized } = options;
    this.synchronized = synchronized !== undefined ? synchronized : true;
  }

  /**
   * The discriminated type of the field.
   */
  abstract readonly type: 'value' | 'list' | 'map' | 'text';

  /**
   * Whether the field value is synchronized among peers.
   */
  readonly synchronized: boolean;

  /**
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': UpdateType;

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': RuntimeType;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@ChangeType': ChangeType;
}


/**
 * The namespace for the `BaseField` class statics.
 */
export
namespace BaseField {
  /**
   * An options object for initializing a base field.
   */
  export
  interface IOptions {
    /**
     * Whether the field value is synchronized among all peers.
     *
     * The default value is `true`.
     */
    synchronized?: boolean;
  }
}


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<T, T, ValueField.IChange<T>> {
  /**
   * The discriminated type of the field.
   */
  get type(): 'value' {
    return 'value';
  }
}


/**
 * The namespace for the `ValueField` class statics.
 */
export
namespace ValueField {
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


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<ReadonlyArray<T>, IList<T>, ListField.IChange<T>> {
  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }
}


/**
 * The namespace for the `ListField` class statics.
 */
export
namespace ListField {
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
     * The value removed at the given index.
     */
    readonly removedValues: ReadonlyArray<T>;

    /**
     * The value inserted at the given index.
     */
    readonly insertedValues: ReadonlyArray<T>;
  }
}


/**
 * A field which represents a mutable map of values.
 */
export
class MapField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<{ readonly [key: string]: T }, IMap<T>, MapField.IChange<T>> {
  /**
   * The discriminated type of the field.
   */
  get type(): 'map' {
    return 'map';
  }
}


/**
 * The namespace for the `MapField` class statics.
 */
export
namespace MapField {
  /**
   * The change type for a map field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The items removed from the map.
     */
    readonly removedItems: { readonly [key: string]: T };

    /**
     * The items added to the map.
     */
    readonly addedItems: { readonly [key: string]: T };
  }
}


/**
 * A field which represents a mutable text value.
 */
export
class TextField extends BaseField<string, IText, TextField.IChange> {
  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }
}


/**
 * The namespace for the `TextField` class statics.
 */
export
namespace TextField {
  /**
   * The change type for a text field.
   */
  export
  interface IChange {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text removed at the given index.
     */
    readonly removedText: string;

    /**
     * The text inserted at the given index.
     */
    readonly insertedText: string;
  }
}


/**
 * A type alias for the field types supported by a data store.
 */
export
type Field = ValueField | ListField | MapField | TextField;
