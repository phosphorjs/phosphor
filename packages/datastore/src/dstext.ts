/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DSHandler
} from './dshandler';


export
class DSText {

  constructor(handler: DSHandler, schemaId: string, recordId: string, fieldName: string) {
    this._handler = handler;
    this._schemaId = schemaId;
    this._recordId = recordId;
    this._fieldName = fieldName;
  }

  private _schemaId: string;
  private _recordId: string;
  private _fieldName: string;
  private _handler: DSHandler;
}
