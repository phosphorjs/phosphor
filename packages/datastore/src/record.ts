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
  FieldSet
} from './fields';


/**
 * A mutable data store object which holds well-defined state.
 */
export
interface IRecord<T extends FieldSet> {
  /**
   * A signal emitted when the state of the record changes.
   */
  readonly changed: ISignal<IRecord<T>, IRecord.IChangedArgs<T>>;

  /**
   * The globally unique id of the record.
   */
  readonly id: string;

  /**
   * The current state of the record.
   */
  readonly state: IRecord.RuntimeState<T>;

  /**
   * Update the state of the record.
   *
   * @param state - The updated state to apply to the record.
   */
  update(state: IRecord.UpdateState<T>): void;
}


/**
 * The namespace for the `IRecord` interface statics.
 */
export
namespace IRecord {
  /**
   * A type alias for the runtime state of a record.
   */
  export
  type RuntimeState<T extends FieldSet> = {
    /**
     * The complete runtime state for the record.
     */
    readonly [K in keyof T]: T[K]['@@RuntimeType'];
  };

  /**
   * A type alias for the update state of a record.
   */
  export
  type UpdateState<T extends FieldSet> = {
    /**
     * The partial update state for the record.
     */
    readonly [K in keyof T]?: T[K]['@@UpdateType'];
  };

  /**
   * A type alias for the change state of a record.
   */
  export
  type ChangeState<T extends FieldSet> = {
    /**
     * The partial change state for the record.
     */
    readonly [K in keyof T]?: T[K]['@@ChangeType'];
  };

  /**
   * The arguments object for the `changed` signal.
   */
  export
  interface IChangedArgs<T extends FieldSet> {
    /**
     * The unique id of the patch which generated the change.
     */
    readonly patchId: string;

    /**
     * The unique id of the record which generated the change.
     */
    readonly recordId: string;

    /**
     * The partial change state for the record.
     */
    readonly changes: ChangeState<T>;
  }
}
