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
 * A class which tracks changes to a datastore.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class DSChanges {
  /**
   * Construct a new datastore change tracker.
   */
  constructor() { }

  /**
   *
   */
  readonly peerChanges: DSChanges.PeerChanges = {};

  /**
   *
   */
  readonly userChanges: DSChanges.UserChanges = {};

  /**
   *
   */
  ensurePeerRecordChanges(schemaId: string, recordId: string): DSChanges.PeerRecordChanges {
    let table = this.peerChanges[schemaId];
    if (!table) {
      table = this.peerChanges[schemaId] = {};
    }
    let record = table[recordId];
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }

  /**
   *
   */
  ensureUserRecordChanges(schemaId: string, recordId: string): DSChanges.UserRecordChanges {
    let table = this.userChanges[schemaId];
    if (!table) {
      table = this.userChanges[schemaId] = {};
    }
    let record = table[recordId];
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }
}


/**
 * The namespace for the `DSChanges` class statics.
 */
export
namespace DSChanges {

  export
  type PeerChanges = {
    [schemaId: string]: PeerTableChanges;
  };

  export
  type PeerTableChanges = {
    [recordId: string]: PeerRecordChanges;
  };

  export
  type PeerRecordChanges = {
    [fieldName: string]: PeerFieldChange;
  };

  export
  type PeerFieldChange = (
    PeerRegisterChange | PeerListChange | PeerMapChange
  );

  export
  type PeerRegisterChange = ReadonlyJSONValue;

  export
  type PeerListChange = {
    remove: { [valueId: string]: ReadonlyJSONValue };
    insert: { [valueId: string]: ReadonlyJSONValue };
  };

  export
  type PeerMapChange = {
    [key: string]: ReadonlyJSONValue | undefined;
  };

  export
  type UserChanges = {
    [schemaId: string]: UserTableChanges;
  };

  export
  type UserTableChanges = {
    [recordId: string]: UserRecordChanges;
  };

  export
  type UserRecordChanges = {
    [fieldName: string]: UserFieldChange;
  };

  export
  type UserFieldChange = (
    UserRegisterChange |
    UserListChange |
    UserMapChange
  );

  export
  type UserRegisterChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    previous: T;
    current: T;
  };

  export
  type UserListChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = (
    ListField.IChange<ReadonlyJSONValue>[]
  );

  export
  type UserMapChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    previous: { [key: string]: T | undefined };
    current: { [key: string]: T | undefined };
  };
}
