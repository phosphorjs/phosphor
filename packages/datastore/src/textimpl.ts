/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DatastoreImpl
} from './datastoreimpl';


export
class TextImpl {

  static fromValue(store: DatastoreImpl, schemaId: string, recordId: string, fieldName: string, initialValue: string): TextImpl {
    return new TextImpl(store, schemaId, recordId, fieldName);
  }

  private constructor(store: DatastoreImpl, schemaId: string, recordId: string, fieldName: string) {
    this._store = store;
    this._schemaId = schemaId;
    this._recordId = recordId;
    this._fieldName = fieldName;
  }

  private _store: DatastoreImpl;
  private _schemaId: string;
  private _recordId: string;
  private _fieldName: string;
}
