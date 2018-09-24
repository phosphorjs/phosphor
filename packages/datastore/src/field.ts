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
 * An abstract base class for datastore field types.
 */
export
abstract class Field<Value extends ReadonlyJSONValue, Update extends ReadonlyJSONValue, Metadata extends ReadonlyJSONValue, Change extends ReadonlyJSONValue, Patch extends ReadonlyJSONValue> {
  /**
   * Construct a new field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: Field.IOptions = {}) {
    let opts = { description: '', ...options };
    this.description = opts.description;
  }

  /**
   * The human-readable description of the field.
   */
  readonly description: string;

  /**
   * The value type for the field.
   *
   * #### Notes
   * This type represents the user-facing value stored in the record.
   */
  readonly ValueType: Value;

  /**
   * The update type for the field.
   *
   * #### Notes
   * This type represents the data the user passes to the `update`
   * method of a table to update the field of a particular record.
   */
  readonly UpdateType: Update;

  /**
   * The metadata type for the field.
   *
   * #### Notes
   * This type represents extra bookeeping data needed by the field
   * to accurately apply updates and patches.
   *
   * This type extends the `ReadonlyJSONValue` type so that it may
   * hold readonly JSON data. However, the metadata is intended to
   * be mutated in-place and thus may also contain mutable data.
   */
  readonly MetadataType: Metadata;

  /**
   * The change type for the field.
   *
   * #### Notes
   * This type represents the user-facing change to the field's value.
   */
  readonly ChangeType: Change;

  /**
   * The patch type for the field.
   *
   * #### Notes
   * This type represents the system-facing patch to the field's value.
   */
  readonly PatchType: Patch;

  /**
   * The discriminated type name for the field.
   */
  abstract readonly type: string;

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  abstract createValue(): Value;

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  abstract createMetadata(): Metadata;

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  abstract applyUpdate(args: Field.UpdateArgs<Value, Update, Metadata>): Field.UpdateResult<Value, Change, Patch>;

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  abstract applyPatch(args: Field.PatchArgs<Value, Patch, Metadata>): Field.PatchResult<Value, Change>;

  /**
   * Merge two change objects into a single change object.
   *
   * @param first - The first change object of interest.
   *
   * @param second - The second change object of interest.
   *
   * @returns A new change object which represents both changes.
   */
  abstract mergeChange(first: Change, second: Change): Change;

  /**
   * Merge two patch objects into a single patch object.
   *
   * @param first - The first patch object of interest.
   *
   * @param second - The second patch object of interest.
   *
   * @returns A new patch object which represents both patches.
   */
  abstract mergePatch(first: Patch, second: Patch): Patch;
}


/**
 * The namespace for the `Field` class statics.
 */
export
namespace Field {
  /**
   * An options object for initializing a field.
   */
  export
  interface IOptions {
    /**
     * The human-readable description of the field.
     *
     * The default is `''`.
     */
    description?: string;
  }

  /**
   * A type alias for the arguments to an update operation.
   */
  export
  type UpdateArgs<ValueType, UpdateType, MetadataType> = {
    /**
     * The previous value of the field.
     */
    readonly previous: ValueType;

    /**
     * The user update for the field.
     */
    readonly update: UpdateType;

    /**
     * The metadata for the field.
     */
    readonly metadata: MetadataType;

    /**
     * The datastore version.
     */
    readonly version: number;

    /**
     * The datastore id.
     */
    readonly storeId: number;
  };

  /**
   * A type alias for the result of an update operation.
   */
  export
  type UpdateResult<ValueType, ChangeType, PatchType> = {
    /**
     * The new value of the field.
     */
    readonly value: ValueType;

    /**
     * The user-facing change for the field.
     */
    readonly change: ChangeType;

    /**
     * The system-facing patch for the field.
     */
    readonly patch: PatchType;
  };

  /**
   * A type alias for the arguments to a patch operation.
   */
  export
  type PatchArgs<ValueType, PatchType, MetadataType> = {
    /**
     * The previous value of the field.
     */
    readonly previous: ValueType;

    /**
     * The system patch for the field.
     */
    readonly patch: PatchType;

    /**
     * The metadata for the field.
     */
    readonly metadata: MetadataType;
  };

  /**
   * A type alias for the result of a patch operation.
   */
  export
  type PatchResult<ValueType, ChangeType> = {
    /**
     * The new value of the field.
     */
    readonly value: ValueType;

    /**
     * The user-facing change for the field.
     */
    readonly change: ChangeType;
  };
}


/**
 * A type alias which is compatible with any field type.
 */
export
type AnyField = Field<ReadonlyJSONValue, ReadonlyJSONValue, ReadonlyJSONValue, ReadonlyJSONValue, ReadonlyJSONValue>;
