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
  RegisterField
} from './fields';

import {
  Record
} from './record';


/**
 * A data store object which holds an atomic value.
 */
export
class Register<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * @internal
   *
   * Create a new data store register.
   *
   * @param parent - The parent record object.
   *
   * @param name - The name of the register.
   *
   * @returns A new data store register.
   *
   * #### Notes
   * This method is an internal implementation detail.
   */
  static create<U extends ReadonlyJSONValue = ReadonlyJSONValue>(parent: Record, name: string): Register<U> {
    return new Register<U>(parent, name);
  }

  /**
   * The parent of the register.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly parent: Record;

  /**
   * The name of the register.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly name: string;

  /**
   * Get the current value of the register.
   *
   * @returns The current value of the register.
   *
   * #### Complexity
   * `O(1)`
   */
  get(): T {
    return this._history.value;
  }

  /**
   * Set the current value of the register.
   *
   * @param value - The current value for the register.
   *
   * #### Complexity
   * `O(1)`
   */
  set(value: T): void {
    // Fetch the context.
    let record = this.parent;
    let table = record.$parent;
    let schema = table.schema;
    let store = table.parent;

    // Guard against disallowed mutations.
    store.mutationGuard();

    // Fetch the previous value.
    let previous = this._history.value;

    // Fetch the version and store id.
    let version = store.version;
    let storeId = store.id;

    // Determine the next link in the history chain.
    let next: Private.IHistory<T> | null;
    if (this._history.version === version) {
      next = this._history.next;
    } else {
      next = this._history;
    }

    // Create the new link in the history chain.
    this._history = { value, version, storeId, next };

    // Notify the store of the mutation.
    store.processMutation({
      type: 'register',
      schemaId: schema.id,
      recordId: record.$id,
      previous: previous,
      current: value
    });
  }

  /**
   * Construct a new data store register.
   *
   * @param parent - The parent record object.
   *
   * @param name - The name of the register.
   *
   * @param value - The initial value of the register.
   */
  private constructor(parent: Record, name: string) {
    this.parent = parent;
    this.name = name;
    this._history = Private.createHistory(this);
  }

  private _history: Private.IHistory<T>;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A linked list which holds register history.
   */
  export
  interface IHistory<T> {
    /**
     * The value for the link.
     */
    readonly value: T;

    /**
     * The version number of the register when the link was created.
     */
    readonly version: number;

    /**
     * The id of the data store which creating the link.
     */
    readonly storeId: number;

    /**
     * The next link in the list.
     */
    next: IHistory<T> | null;
  }

  /**
   * Compute the default value for a register.
   *
   * @param register - The register of interest.
   *
   * @returns The schema-defined default value for the register.
   */
  export
  function createHistory<T extends ReadonlyJSONValue>(register: Register<T>): IHistory<T> {
    let schema = register.parent.$parent.schema;
    let value = (schema.fields[register.name] as RegisterField<T>).value;
    return { value, version: 0, storeId: 0, next: null };
  }
}
