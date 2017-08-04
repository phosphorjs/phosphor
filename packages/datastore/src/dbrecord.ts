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
  ISignal
} from '@phosphor/signaling';

import {
  IDBList
} from './dblist';

import {
  IDBMap
} from './dbmap';

import {
  IDBObject
} from './dbobject';

import {
  IDBString
} from './dbstring';


/**
 * A db object which holds well-defined state.
 */
export
type DBRecord<T extends DBRecord.State> = T & IDBObject & {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<DBRecord<T>, DBRecord.ChangedArgs<T>>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'record';

  /**
   * Get the value for a property in the record.
   *
   * @param name - The name of the property of interest.
   *
   * @returns The value for the property.
   */
  get<K extends keyof T>(name: K): T[K];

  /**
   * Set the value for a property in the record.
   *
   * @param name - The name of the property of interest.
   *
   * @param value - The value for the property.
   */
  set<K extends keyof T>(name: K, value: T[K]): void;
};


/**
 * The namespace for the `DBRecord` type statics.
 */
export
namespace DBRecord {
  /**
   * A type alias for the allowed state of a db record.
   *
   * #### Notes
   * The record state cannot have property names which begin with an
   * underscore, or which conflict with the properties of `IDBRecord`.
   */
  export
  type State = {
    /**
     * The index signature for the state of a db record.
     */
    [key: string]: ReadonlyJSONValue | IDBList | IDBMap | IDBString;
  };

  /**
   * The type of the db record state changed arguments.
   */
  export
  type StateChangedArgs<T extends State> = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'record:changed';

    /**
     * The previous values of the modified record properties.
     */
    readonly previous: Readonly<Partial<T>>;

    /**
     * The current values of the modified record properties.
     */
    readonly current: Readonly<Partial<T>>;
  };

  /**
   * The type of the db record list changed arguments.
   */
  export
  type ListChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'record:list:changed';

    /**
     * The child list that was changed.
     */
    readonly child: IDBList;

    /**
     * The args for the child change.
     */
    readonly childArgs: IDBList.ChangedArgs;
  };

  /**
   * The type of the db record map changed arguments.
   */
  export
  type MapChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'record:map:changed';

    /**
     * The child map that was changed.
     */
    readonly child: IDBMap;

    /**
     * The args for the child change.
     */
    readonly childArgs: IDBMap.ChangedArgs;
  };

  /**
   * The type of the db record string changed arguments.
   */
  export
  type StringChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'record:string:changed';

    /**
     * The child string that was changed.
     */
    readonly child: IDBString;

    /**
     * The args for the child change.
     */
    readonly childArgs: IDBString.ChangedArgs;
  };

  /**
   * The type of the db record changed arguments.
   */
  export
  type ChangedArgs<T extends State> = (
    StateChangedArgs<T> | ListChangedArgs | MapChangedArgs | StringChangedArgs
  );
}
