/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Field
} from './field';


/**
 * A field which represents collaborative text.
 */
export
class TextField extends Field<TextField.Value, TextField.Update, TextField.Metadata, TextField.Change, TextField.Patch> {
  /**
   * Construct a new text field.
   *
   * @param options - The options for initializing the field.
   */
  constructor(options: TextField.IOptions = {}) {
    super(options);
  }

  /**
   * The discriminated type of the field.
   */
  get type(): 'text' {
    return 'text';
  }

  /**
   * Create the initial value for the field.
   *
   * @returns The initial value for the field.
   */
  createValue(): TextField.Value {
    return '';
  }

  /**
   * Create the metadata for the field.
   *
   * @returns The metadata for the field.
   */
  createMetadata(): TextField.Metadata {
    return { ids: [], cemetery: {} };
  }

  /**
   * Apply a user update to the field.
   *
   * @param args - The arguments for the update.
   *
   * @returns The result of applying the update.
   */
  applyUpdate(args: Field.UpdateArgs<TextField.Value, TextField.Update, TextField.Metadata>): Field.UpdateResult<TextField.Value, TextField.Change, TextField.Patch> {
    throw '';
  }

  /**
   * Apply a system patch to the field.
   *
   * @param args - The arguments for the patch.
   *
   * @returns The result of applying the patch.
   */
  applyPatch(args: Field.PatchArgs<TextField.Value, TextField.Patch, TextField.Metadata>): Field.PatchResult<TextField.Value, TextField.Change> {
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
  mergeChange(first: TextField.Change, second: TextField.Change): TextField.Change {
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
  mergePatch(first: TextField.Patch, second: TextField.Patch): TextField.Patch {
    throw '';
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
  interface IOptions extends Field.IOptions { }

  /**
   * A type alias for the value type of a text field.
   */
  export
  type Value = string;

  /**
   * A type alias for a text field splice.
   */
  export
  type Splice = {
    /**
     * The index of the splice.
     */
    readonly index: number;

    /**
     * The number of characters to remove.
     */
    readonly remove: number;

    /**
     * The text to insert.
     */
    readonly text: string;
  };

  /**
   * A type alias for the text field update type.
   */
  export
  type Update = Splice | ReadonlyArray<Splice>;

  /**
   * A type alias for a text field change part.
   */
  export
  type ChangePart = {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text that was removed.
     */
    readonly removed: string;

    /**
     * The text that was inserted.
     */
    readonly inserted: string;
  };

  /**
   * A type alias for the text field change type.
   */
  export
  type Change = ReadonlyArray<ChangePart>;

  /**
   * A type alias for the text field patch type.
   */
  export
  type Patch = {
    /**
     * The id:char pairs removed from the text.
     */
    readonly removed: { readonly [id: string]: string };

    /**
     * The id:char pairs inserted into the text.
     */
    readonly inserted: { readonly [id: string]: string };
  };

  /**
   * A type alias for the text field metadata type.
   */
  export
  type Metadata = {
    /**
     * An array of ids corresponding to the text characters.
     */
    readonly ids: Array<string>;

    /**
     * The cemetery for concurrently deleted characters.
     */
    readonly cemetery: { [id: string]: number };
  };
}
