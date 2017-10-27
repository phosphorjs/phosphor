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
  Schema
} from './schema';


/**
 * A mutable data store object which holds well-defined state.
 */
export
interface IRecord<S extends Schema> {
  /**
   * A signal emitted when the state of the record changes.
   */
  readonly changed: ISignal<IRecord<S>, IRecord.IChangedArgs<S>>;

  /**
   * The globally unique id of the record.
   */
  readonly id: string;

  /**
   * The schema for the record.
   */
  readonly schema: S;

  /**
   * The current state of the record.
   */
  readonly state: IRecord.RuntimeState<S>;

  /**
   * Update the state of the record.
   *
   * @param state - The updated state to apply to the record.
   */
  update(state: IRecord.UpdateState<S>): void;
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
  type RuntimeState<S extends Schema> = {
    /**
     * The complete runtime state for the record.
     */
    readonly [K in keyof S['fields']]: S['fields'][K]['@@RuntimeType'];
  };

  /**
   * A type alias for the inital state of a record.
   */
  export
  type InitialState<S extends Schema> = {
    /**
     * The inital state for the record.
     */
    readonly [K in keyof S['fields']]: S['fields'][K]['@@UpdateType'];
  };

  /**
   * A type alias for the update state of a record.
   */
  export
  type UpdateState<S extends Schema> = {
    /**
     * The partial update state for the record.
     */
    readonly [K in keyof S['fields']]?: S['fields'][K]['@@UpdateType'];
  };

  /**
   * A type alias for the change state of a record.
   */
  export
  type ChangeState<S extends Schema> = {
    /**
     * The partial change state for the record.
     */
    readonly [K in keyof S['fields']]?: S['fields'][K]['@@ChangeType'];
  };

  /**
   * The arguments object for the `changed` signal.
   */
  export
  interface IChangedArgs<S extends Schema> {
    /**
     * The unique id of the patch which generated the change.
     */
    readonly patchId: string;

    /**
     * The partial change state for the record.
     */
    readonly changes: ChangeState<S>;
  }
}
