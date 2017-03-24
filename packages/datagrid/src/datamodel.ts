/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
// import {
//   ISignal, Signal
// } from '@phosphor/signaling';


// /**
//  *
//  */
// export
// abstract class DataModel {
//   /**
//    *
//    */
//   get changed(): ISignal<this, DataModel.ChangedArgs> {
//     return this._changed;
//   }

//   /**
//    *
//    */
//   abstract get rowCount(): number;

//   /**
//    *
//    */
//   abstract get columnCount(): number;

//   /**
//    *
//    */
//   abstract cellData(row: number, column: number, out: DataModel.IData): void;

//   /**
//    *
//    */
//   protected emitChanged(args: DataModel.ChangedArgs): void {
//     this._changed.emit(args);
//   }

//   /**
//    *
//    */
//   private _changed = new Signal<this, DataModel.ChangedArgs>(this);
// }


// /**
//  *
//  */
// export
// namespace DataModel {
//   /**
//    *
//    */
//   export
//   interface IData {
//     /**
//      *
//      */
//     value: any;

//     /**
//      *
//      */
//     renderer: string;

//     /**
//      *
//      */
//     config: any;
//   }

//   /**
//    *
//    */
//   export
//   interface IModelChangedArgs {
//     /**
//      *
//      */
//     type: 'model-changed';
//   }

//   /**
//    *
//    */
//   export
//   interface IRowsChangedArgs {
//     /**
//      *
//      */
//     type: 'rows-inserted' | 'rows-removed' | 'rows-changed';

//     /**
//      *
//      */
//     startRow: number;

//     /**
//      *
//      */
//     endRow: number;
//   }

//   *
//    *

//   export
//   interface IRowsMovedArgs {
//     /**
//      *
//      */
//     type: 'rows-moved';

//     /**
//      *
//      */
//     startRow: number;

//     /**
//      *
//      */
//     endRow: number;

//     /**
//      *
//      */
//     destRow: number;
//   }

//   /**
//    *
//    */
//   export
//   interface IColumnsChangedArgs {
//     /**
//      *
//      */
//     type: 'columns-inserted' | 'columns-removed' | 'columns-changed';

//     /**
//      *
//      */
//     startColumn: number;

//     /**
//      *
//      */
//     endColumn: number;
//   }

//   /**
//    *
//    */
//   export
//   interface IColumnsMovedArgs {
//     /**
//      *
//      */
//     type: 'columns-moved';

//     /**
//      *
//      */
//     startColumn: number;

//     /**
//      *
//      */
//     endColumn: number;

//     /**
//      *
//      */
//     destColumn: number;
//   }

//   /**
//    *
//    */
//   export
//   interface ICellsChangedArgs {
//     /**
//      *
//      */
//     type: 'cells-changed';

//     /**
//      *
//      */
//     startRow: number;

//     /**
//      *
//      */
//     endRow: number;

//     /**
//      *
//      */
//     startColumn: number;

//     /**
//      *
//      */
//     endColumn: number;
//   }

//   /**
//    *
//    */
//   export
//   type ChangedArgs = (
//     IModelChangedArgs |
//     ISectionsChangedArgs |
//     ISectionsMovedArgs |
//     ICellsChangedArgs
//   );
// }
