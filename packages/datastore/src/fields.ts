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
abstract class BaseField {
  /**
   * Construct a new base field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: BaseField.IOptions = {}) { }
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
 * A field which represents a boolean value.
 */
export
class BooleanField extends BaseField {
  /**
   * Construct a new boolean field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: BooleanField.IOptions = {}) {
    super(options);
    this.defaultValue = options.defaultValue || false;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'boolean' {
    return 'boolean';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: boolean;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': boolean;
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
  interface IOptions extends BaseField.IOptions {
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
class NumberField extends BaseField {
  /**
   * Construct a new number field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: NumberField.IOptions = {}) {
    super(options);
    this.defaultValue = options.defaultValue || 0;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'number' {
    return 'number';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: number;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': number;
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
  interface IOptions extends BaseField.IOptions {
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
class StringField extends BaseField {
  /**
   * Construct a new string field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: StringField.IOptions = {}) {
    super(options);
    this.defaultValue = options.defaultValue || '';
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'string' {
    return 'string';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: string;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': string;
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
  interface IOptions extends BaseField.IOptions {
    /**
     * The default value for the field.
     *
     * The default is `''`.
     */
    defaultValue?: string;
  }
}


/**
 * A field which represents a mutable text value.
 */
export
class TextField extends BaseField {
  /**
   * Construct a new text field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: TextField.IOptions = {}) {
    super(options);
    this.defaultValue = options.defaultValue || '';
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: string;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': IText;
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
}


/**
 * A field which represents a mutable list of values.
 */
export
class ListField<T extends ReadonlyJSONValue> extends BaseField {
  /**
   * Construct a new list field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ListField.IOptions<T> = {}) {
    super(options);
    this.defaultValue = [ ...(options.defaultValue || []) ];
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'list' {
    return 'list';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: ReadonlyArray<T>;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': IList<T>;
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
}


/**
 * A field which represents a mutable map of values.
 */
export
class MapField<T extends ReadonlyJSONValue> extends BaseField {
  /**
   * Construct a new map field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: MapField.IOptions<T> = {}) {
    super(options);
    this.defaultValue = { ...(options.defaultValue || {}) };
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'map' {
    return 'map';
  }

  /**
   * The default value for the field.
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: { readonly [key: string]: T };

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': IMap<T>;
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
    defaultValue?: { [key: string]: T };
  }
}


/**
 * A field which represents a readonly JSON value.
 */
export
class ValueField<T extends ReadonlyJSONValue> extends BaseField {
  /**
   * Construct a new value field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: ValueField.IOptions<T>) {
    super(options);
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
   *
   * #### Notes
   * The default value may be overridden when a record is created.
   */
  readonly defaultValue: T;

  /**
   * The value type for the field as stored in a record.
   *
   * #### Notes
   * This is an internal property which is only used to support the
   * type system. The runtime value of this property is undefined.
   */
  readonly '@@valueType': T;
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
  interface IOptions<T extends ReadonlyJSONValue> extends BaseField.IOptions {
    /**
     * The default value for the field.
     */
    defaultValue: T;
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
  TextField |
  ListField<ReadonlyJSONValue> |
  MapField<ReadonlyJSONValue> |
  ValueField<ReadonlyJSONValue>
);
