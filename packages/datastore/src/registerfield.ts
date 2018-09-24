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
  Field
} from './field';


/**
 * A field which represents a collaborative atomic value.
 */
export
class RegisterField<T extends ReadonlyJSONValue> extends Field<RegisterField.Value<T>, RegisterField.Update<T>, RegisterField.Metadata<T>, RegisterField.Change<T>, RegisterField.Patch<T>> {
  /**
   * Construct a new register field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: RegisterField.IOptions<T>) {
    super(options);
    this.value = options.value;
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'register' {
    return 'register';
  }

  /**
   * The initial value for the field.
   */
  readonly value: T;

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  createValue(): RegisterField.Value<T> {
    return this.value;
  }

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  createMetadata(): RegisterField.Metadata<T> {
    return { ids: [], values: [] };
  }

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  applyUpdate(args: Field.UpdateArgs<RegisterField.Value<T>, RegisterField.Update<T>, RegisterField.Metadata<T>>): Field.UpdateResult<RegisterField.Value<T>, RegisterField.Change<T>, RegisterField.Patch<T>> {
    throw '';
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<RegisterField.Value<T>, RegisterField.Patch<T>, RegisterField.Metadata<T>>): Field.PatchResult<RegisterField.Value<T>, RegisterField.Change<T>> {
    throw '';
  }

  /**
   * Merge two change objects into a single change object.
   *
   * @param first - The first change object of interest.
   *
   * @param second - The second change object of interest.
   *
   * @returns A new change object which represents both changes.
   */
  mergeChange(first: RegisterField.Change<T>, second: RegisterField.Change<T>): RegisterField.Change<T> {
    throw '';
  }

  /**
   * Merge two patch objects into a single patch object.
   *
   * @param first - The first patch object of interest.
   *
   * @param second - The second patch object of interest.
   *
   * @returns A new patch object which represents both patches.
   */
  mergePatch(first: RegisterField.Patch<T>, second: RegisterField.Patch<T>): RegisterField.Patch<T> {
    throw '';
  }
}


/**
 * The namespace for the `RegisterField` class statics.
 */
export
namespace RegisterField {
  /**
   * An options object for initializing a register field.
   */
  export
  interface IOptions<T extends ReadonlyJSONValue> extends Field.IOptions {
    /**
     * The initial value for the field.
     */
    value: T;
  }

  /**
   * A type alias for the register field value type.
   */
  export
  type Value<T extends ReadonlyJSONValue> = T;

  /**
   * A type alias for the register field update type.
   */
  export
  type Update<T extends ReadonlyJSONValue> = T;

  /**
   * A type alias for the register field change type.
   */
  export
  type Change<T extends ReadonlyJSONValue> = {
    /**
     * The previous value of the field.
     */
    readonly previous: T;

    /**
     * The current value of the field.
     */
    readonly current: T;
  };

  /**
   * A type alias for the register field patch type.
   */
  export
  type Patch<T extends ReadonlyJSONValue> = {
    /**
     * The unique id for the value.
     */
    readonly id: string;

    /**
     * The current value of the field.
     */
    readonly value: T;
  };

  /**
   * A type alias for the register field metadata type.
   */
  export
  type Metadata<T extends ReadonlyJSONValue> = {
    /**
     * An array of id history.
     */
    readonly ids: Array<string>;

    /**
     * An array of value history.
     */
    readonly values: Array<T>;
  };
}
