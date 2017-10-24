/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
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
abstract class BaseField<DefaultType, RuntimeType, ChangeType> {
  /**
   * Construct a new base field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(defaultValue: DefaultType, options: BaseField.IOptions = {}) {
    this.defaultValue = defaultValue;
  }

  /**
   * The discriminated type of the field.
   */
  abstract readonly type: 'boolean' | 'number' | 'string' | 'value' | 'list' | 'map' | 'text';

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: DefaultType;

  /**
   * The runtime type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@RuntimeType': RuntimeType;

  /**
   * The update type for the field.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@UpdateType': DefaultType;

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
  interface IOptions { }
}


/**
 * An abstract base class for atomic-valued fields.
 */
export
abstract class AtomicField<T> extends BaseField<T, T, AtomicField.IChange<T>> {
  /**
   * The discriminated type of the field.
   */
  abstract readonly type: 'boolean' | 'number' | 'string' | 'value';
}


/**
 * The namespace for the `AtomicField` class statics.
 */
export
namespace AtomicField {
  /**
   * An options object for initializing an atomic field.
   */
  export
  interface IOptions extends BaseField.IOptions { }

  /**
   * The change type for an atomic field.
   */
  export
  interface IChange<T> {
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
 * A field which represents a boolean value.
 */
export
class BooleanField extends AtomicField<boolean> {
  /**
   * Construct a new boolean field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: BooleanField.IOptions = {}) {
    super(options.defaultValue || false, options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'boolean' {
    return 'boolean';
  }
}


/**
 * The namespace for the `BooleanField` class statics.
 */
export
namespace BooleanField {
  /**
   * An options object for initializing a boolean field.
   */
  export
  interface IOptions extends AtomicField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `false`.
     */
    defaultValue?: boolean;
  }
}


/**
 * A field which represents a number value.
 */
export
class NumberField extends AtomicField<number> {
  /**
   * Construct a new number field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: NumberField.IOptions = {}) {
    super(options.defaultValue || 0, options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'number' {
    return 'number';
  }
}


/**
 * The namespace for the `NumberField` class statics.
 */
export
namespace NumberField {
  /**
   * An options object for initializing a number field.
   */
  export
  interface IOptions extends AtomicField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `0`.
     */
    defaultValue?: number;
  }
}


/**
 * A field which represents a string value.
 */
export
class StringField extends AtomicField<string> {
  /**
   * Construct a new string field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: StringField.IOptions = {}) {
    super(options.defaultValue || '', options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'string' {
    return 'string';
  }
}


/**
 * The namespace for the `StringField` class statics.
 */
export
namespace StringField {
  /**
   * An options object for initializing a string field.
   */
  export
  interface IOptions extends AtomicField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `''`.
     */
    defaultValue?: string;
  }
}


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends AtomicField<T> {
  /**
   * Construct a new value field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ValueField.IOptions<T>) {
    super(options.defaultValue, options);
  }

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
   * An options object for initializing a value field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> extends AtomicField.IOptions {
    /**
     * The default value for the field.
     */
    defaultValue: T;
  }
}


/**
 * A field which represents a mutable sequence of values.
 */
export
class ListField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<ReadonlyArray<T>, IList<T>, ListField.IChange<T>> {
  /**
   * Construct a new list field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ListField.IOptions<T> = {}) {
    super([ ...(options.defaultValue || []) ], options);
  }

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
   * An options object for initializing a list field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `[]`.
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
 * A type alias for a readonly object map.
 */
export
type ReadonlyMap<T> = { readonly [key: string]: T };


/**
 * A field which represents a mutable map of values.
 */
export
class MapField<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends BaseField<ReadonlyMap<T>, IMap<T>, MapField.IChange<T>> {
  /**
   * Construct a new map field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: MapField.IOptions<T> = {}) {
    super({ ...(options.defaultValue || {}) }, options);
  }

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
   * An options object for initializing a map field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `{}`.
     */
    defaultValue?: ReadonlyMap<T>;
  }

  /**
   * The change type for a map field.
   */
  export
  interface IChange<T extends ReadonlyJSONValue> {
    /**
     * The items removed from the map.
     */
    readonly removedItems: ReadonlyMap<T>;

    /**
     * The items added to the map.
     */
    readonly addedItems: ReadonlyMap<T>;
  }
}


/**
 * A field which represents a mutable text value.
 */
export
class TextField extends BaseField<string, IText, TextField.IChange> {
  /**
   * Construct a new text field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: TextField.IOptions = {}) {
    super(options.defaultValue || '', options);
  }

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
   * An options object for initializing a text field.
   */
  export
  interface IOptions extends BaseField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `''`.
     */
    defaultValue?: string;
  }

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
type Field = (
  BooleanField |
  NumberField |
  StringField |
  ValueField |
  ListField |
  MapField |
  TextField
);


/**
 * A type alias for a field set.
 */
export
type FieldSet = ReadonlyMap<Field>;
