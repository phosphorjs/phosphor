// /*-----------------------------------------------------------------------------
// | Copyright (c) 2014-2019, PhosphorJS Contributors
// |
// | Distributed under the terms of the BSD 3-Clause License.
// |
// | The full license is in the file LICENSE, distributed with this software.
// |----------------------------------------------------------------------------*/
// import {
//   EventHandler
// } from "./eventhandler";


// /**
//  *
//  */
// class SelectHandler implements EventHandler.IProxy {
//   /**
//    * Handle the mouse down event for the `'select'` state.
//    *
//    * @param event - The mouse event of interest.
//    *
//    * #### Notes
//    * The default implementation starts a select operation.
//    *
//    * This method may be reimplemented by a subclass.
//    */
//   protected select_onMouseDown(event: MouseEvent): void {
//     // // Hit test the grid.
//     // let hit = this.grid.hitTest(event.clientX, event.clientY);

//     // // Bail early if the position is out of bounds.
//     // if (!hit || hit.region === 'void') {
//     //   return;
//     // }

//     // // Unpack the hit test result.
//     // let { region, row, column } = hit;

//     // // Unpack the event.
//     // let { ctrlKey, shiftKey } = event;

//     // // Override the document cursor.
//     // let override = Drag.overrideCursor('default');

//     // // Set up the select state.
//     // this.selectData = { region, row, column, ctrlKey, shiftKey, override };

//     // // Fetch the selection model.
//     // let model = this.grid.selectionModel;

//     // // Bail if there is no selection model.
//     // if (!model) {
//     //   return;
//     // }

//     // // TODO infinite selections

//     // // Determine the mode for the selection.
//     // let mode: 'create' | 'resize' = shiftKey ? 'resize' : 'create';

//     // // Determine whether to clear the existing selections.
//     // let clear = !shiftKey && !ctrlKey;

//     // // Select the desired cell.
//     // model.select({ mode, clear, row, column });
//   }

//   /**
//    * Handle the mouse move event for the `'select'` state.
//    *
//    * @param event - The mouse event of interest.
//    *
//    * #### Notes
//    * The default implementation continues a select operation.
//    *
//    * This method may be reimplemented by a subclass.
//    */
//   protected select_onMouseMove(event: MouseEvent): void {
//     // // Bail early if the internal state is corrupt.
//     // if (!this.selectData) {
//     //   return;
//     // }

//     // // Hit test the grid.
//     // let hit = this.grid.hitTest(event.clientX, event.clientY);

//     // // Bail early if the hit test is out of bounds.
//     // // TODO - auto-scroll the grid.
//     // if (!hit || hit.region === 'void') {
//     //   return;
//     // }

//     // // Fetch the selection model.
//     // let model = this.grid.selectionModel;

//     // // Bail early if there is no selection model.
//     // if (!model) {
//     //   return;
//     // }

//     // // Unpack the hit test result.
//     // let { row, column } = hit;

//     // // TODO infinite selections

//     // // Select the desired row.
//     // model.select({ mode: 'resize', clear: false, row, column });
//   }

//   /**
//    * Handle the mouse up event for the `'select'` state.
//    *
//    * @param event - The mouse event of interest.
//    *
//    * #### Notes
//    * The default implementation ends a select operation.
//    *
//    * This method may be reimplemented by a subclass.
//    */
//   protected select_onMouseUp(event: MouseEvent): void {
//     // // Fetch the select data.
//     // let data = this.selectData;

//     // // Bail early if the internal state is corrupt.
//     // if (!data) {
//     //   return;
//     // }

//     // // Clear the internal data.
//     // this.selectData = null;

//     // // Clear the document cursor override.
//     // data.override.dispose();

//     // // Hit test the grid.
//     // let hit = this.grid.hitTest(event.clientX, event.clientY);

//     // // Bail early if the hit test is out of bounds.
//     // if (!hit || hit.region === 'void') {
//     //   return;
//     // }

//     // //
//     // if (data.region !== hit.region || data.row !== hit.row || data.column !== hit.column) {
//     //   return;
//     // }
//   }

//   /**
//    *
//    */
//   protected select_onWheel(event: WheelEvent): void { }
// }
//   /**
//    * A type alias for the event handler select data.
//    */
//   export
//   type SelectData = {
//     /**
//      * The original region for the mouse press.
//      */
//     readonly region: DataModel.CellRegion;

//     /**
//      * The original row that was pressed.
//      */
//     readonly row: number;

//     /**
//      * The original column that was pressed.
//      */
//     readonly column: number;

//     /**
//      * Whether the control key was held.
//      */
//     readonly ctrlKey: boolean;

//     /**
//      * Whether the shift key was held.
//      */
//     readonly shiftKey: boolean;

//     /**
//      * The disposable to clear the cursor override.
//      */
//     readonly override: IDisposable;
//   };
