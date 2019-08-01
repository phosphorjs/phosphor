// /*-----------------------------------------------------------------------------
// | Copyright (c) 2014-2019, PhosphorJS Contributors
// |
// | Distributed under the terms of the BSD 3-Clause License.
// |
// | The full license is in the file LICENSE, distributed with this software.
// |----------------------------------------------------------------------------*/
// import {
//   IDisposable
// } from '@phosphor/disposable';

// import {
//   Drag
// } from '@phosphor/dragdrop';

// import {
//   ConflatableMessage, IMessageHandler, Message, MessageLoop
// } from '@phosphor/messaging';

// import {
//   Signal
// } from '@phosphor/signaling';

// import {
//   DataGrid
// } from './datagrid';

export
class SectionResizeBehavior {
  constructor(options: any) {}
}

// /**
//  * A data grid behavior which handles the resizing of rows and columns.
//  *
//  * #### Notes
//  * This class is not designed to be subclassed.
//  */
// export
// class SectionResizeBehavior implements IDisposable, IMessageHandler {
//   /**
//    * Construct a new section resize behavior.
//    *
//    * @param options - The options for initializing the behavior.
//    */
//   constructor(options: SectionResizeBehavior.IOptions) {
//     // Parse the options.
//     this.grid = options.grid;

//     // Connect the signal handlers.
//     this.grid.disposed.connect(() => { this.dispose(); });

//     // Add the grid event listeners.
//     this.grid.node.addEventListener('mousedown', this);
//     this.grid.node.addEventListener('mousemove', this);
//   }

//   /**
//    * Dispose of the behavior.
//    */
//   dispose(): void {
//     // Bail early if the behavior is already disposed.
//     if (this._disposed) {
//       return;
//     }

//     // Mark the behavior as disposed.
//     this._disposed = true;

//     // Release the mouse.
//     this._releaseMouse();

//     // Remove the grid event listeners.
//     this.grid.node.removeEventListener('mousedown', this);
//     this.grid.node.removeEventListener('mousemove', this);

//     // Clear the extra data associated with the behavior.
//     Signal.clearData(this);
//     MessageLoop.clearData(this);
//   }

//   /**
//    * Get the data grid associated with the behavior.
//    */
//   readonly grid: DataGrid;

//   /**
//    * Test whether the behavior has been disposed.
//    */
//   get isDisposed(): boolean {
//     return this._disposed;
//   }

//   /**
//    * Handle the DOM events for the data grid.
//    *
//    * @param event - The DOM event sent to the data grid.
//    *
//    * #### Notes
//    * This method implements the DOM `EventListener` interface and is
//    * called in response to events on the data grid's DOM node. It
//    * should not be called directly by user code.
//    */
//   handleEvent(event: Event): void {
//     switch (event.type) {
//     case 'mousemove':
//       this._evtMouseMove(event as MouseEvent);
//       break;
//     case 'mousedown':
//       this._evtMouseDown(event as MouseEvent);
//       break;
//     case 'mouseup':
//       this._evtMouseUp(event as MouseEvent);
//       break;
//     case 'keydown':
//       this._evtKeyDown(event as KeyboardEvent);
//       break;
//     case 'contextmenu':
//       event.preventDefault();
//       event.stopPropagation();
//       break;
//     }
//   }

//   /**
//    * Process messages sent to the behavior.
//    *
//    * @param msg - The message sent to the behavior.
//    */
//   processMessage(msg: Message): void {
//     if (msg.type === 'section-resize-request') {
//       this._onSectionResizeRequest(msg);
//     }
//   }

//   /**
//    * Handle the `'mousemove'` event for the data grid.
//    */
//   private _evtMouseMove(event: MouseEvent): void {
//     // If a drag is not in progress, hit test for a resize handle.
//     if (!this._pressData) {
//       // Hit test the grid headers for a resize handle.
//       let handle = Private.hitTest(this.grid, event.clientX, event.clientY);

//       // TODO - unequivicolly setting the cursor below, even when a
//       // handle is not hit, may conflict with other behaviors and
//       // the cursors they may want to apply.

//       // Update the grid cursor.
//       this.grid.node.style.cursor = Private.cursorForHandle(handle);

//       // Done.
//       return;
//     }

//     // Otherwise, the event is for the drag in progress.

//     // Stop the event.
//     event.preventDefault();
//     event.stopPropagation();

//     // Update the press data with the current mouse position.
//     this._pressData.clientX = event.clientX;
//     this._pressData.clientY = event.clientY;

//     // Post a section resize request message to the viewport.
//     MessageLoop.postMessage(this, Private.SectionResizeRequest);
//   }

//   /**
//    * Handle the `'mousedown'` event for the data grid.
//    */
//   private _evtMouseDown(event: MouseEvent): void {
//     // Do nothing if the left mouse button is not pressed.
//     if (event.button !== 0) {
//       return;
//     }

//     // Extract the client position.
//     let { clientX, clientY } = event;

//     // Hit test for a resize handle.
//     let handle = Private.hitTest(this.grid, clientX, clientY);

//     // Bail early if no resize handle is pressed.
//     if (!handle) {
//       return;
//     }

//     // Stop the event when a resize handle is pressed.
//     event.preventDefault();
//     event.stopPropagation();

//     // Look up the cursor for the handle.
//     let cursor = Private.cursorForHandle(handle);

//     // Override the document cursor.
//     let override = Drag.overrideCursor(cursor);

//     // Set up the press data.
//     this._pressData = { handle, clientX, clientY, override };

//     // Add the extra document listeners.
//     document.addEventListener('mousemove', this, true);
//     document.addEventListener('mouseup', this, true);
//     document.addEventListener('keydown', this, true);
//     document.addEventListener('contextmenu', this, true);
//   }

//   /**
//    * Handle the `'mouseup'` event for the data grid.
//    */
//   private _evtMouseUp(event: MouseEvent): void {
//     // Do nothing if the left mouse button is not released.
//     if (event.button !== 0) {
//       return;
//     }

//     // Stop the event when releasing the mouse.
//     event.preventDefault();
//     event.stopPropagation();

//     // Finalize the mouse release.
//     this._releaseMouse();
//   }

//   /**
//    * Handle the `'keydown'` event for the data grid.
//    */
//   private _evtKeyDown(event: KeyboardEvent): void {
//     // Stop input events during drag.
//     event.preventDefault();
//     event.stopPropagation();

//     // Release the mouse if `Escape` is pressed.
//     if (event.keyCode === 27) {
//       this._releaseMouse();
//     }
//   }

//   /**
//    * Release the mouse grab for the data grid.
//    */
//   private _releaseMouse(): void {
//     // Bail early if no drag is in progress.
//     if (!this._pressData) {
//       return;
//     }

//     // Clear the press data and cursor override.
//     this._pressData.override.dispose();
//     this._pressData = null;

//     // Remove the extra document listeners.
//     document.removeEventListener('mousemove', this, true);
//     document.removeEventListener('mouseup', this, true);
//     document.removeEventListener('keydown', this, true);
//     document.removeEventListener('contextmenu', this, true);
//   }

//   /**
//    * A message handler invoked on a `'section-resize-request'` message.
//    */
//   private _onSectionResizeRequest(msg: Message): void {
//     // Bail early if a drag is not in progress.
//     if (!this._pressData) {
//       return;
//     }

//     // Extract the relevant press data.
//     let { handle, clientX, clientY } = this._pressData;

//     // Resize the grid section for the handle.
//     Private.resizeSection(this.grid, handle, clientX, clientY);
//   }

//   private _disposed = false;
//   private _pressData: Private.IPressData | null = null;
// }


// *
//  * The namespace for the `SectionResizeBehavior` class statics.

// export
// namespace SectionResizeBehavior {
//   /**
//    * The options object for initializing a section resize behavior.
//    */
//   export
//   interface IOptions {
//     /**
//      * The data grid to associate with the behavior.
//      */
//     grid: DataGrid;
//   }
// }


// /**
//  * The namespace for the module implementation details.
//  */
// namespace Private {
//   /**
//    * A singleton `section-resize-request` conflatable message.
//    */
//   export
//   const SectionResizeRequest = new ConflatableMessage('section-resize-request');

//   /**
//    * An object which represents a virtual resize handle.
//    */
//   export
//   interface IResizeHandle {
//     /**
//      * The section group for the resize handle.
//      */
//     group: DataGrid.SectionGroup;

//     /**
//      * The index of the handle in the region.
//      */
//     index: number;

//     /**
//      * The delta between the queried position and handle position.
//      */
//     delta: number;
//   }

//   /**
//    * An object which stores the mouse press data.
//    */
//   export
//   interface IPressData {
//     /**
//      * The resize handle which was pressed.
//      */
//     handle: IResizeHandle;

//     /**
//      * The most recent client X position of the mouse.
//      */
//     clientX: number;

//     /**
//      * The most recent client Y position of the mouse.
//      */
//     clientY: number;

//     /**
//      * The disposable which will clear the override cursor.
//      */
//     override: IDisposable;
//   }

//   /**
//    * Get the cursor to use for a resize handle.
//    */
//   export
//   function cursorForHandle(handle: IResizeHandle | null): string {
//     return handle ? cursorMap[handle.group] : '';
//   }

//   /**
//    * Hit test the data grid for a resize handle.
//    */
//   export
//   function hitTest(grid: DataGrid, clientX: number, clientY: number): Private.IResizeHandle | null {
//     // Look up the header dimensions.
//     let hw = grid.headerWidth;
//     let hh = grid.headerHeight;

//     // Convert the mouse position into local coordinates.
//     let rect = grid.viewportClientRect();
//     let x = clientX - rect.left;
//     let y = clientY - rect.top;

//     // Bail early if the mouse is not over a grid header.
//     if (x >= hw && y >= hh) {
//       return null;
//     }

//     // Test for a match in the corner header first.
//     if (x <= hw + 2 && y <= hh + 2) {
//       // Set up the resize index data.
//       let data: { index: number, delta: number } | null = null;

//       // Check for a row header match if applicable.
//       if (y <= hh) {
//         data = findResizeIndex(grid, 'row-header', x);
//       }

//       // Return the match if found.
//       if (data) {
//         return { group: 'row-header', index: data.index, delta: data.delta };
//       }

//       // Check for a column header match if applicable.
//       if (x <= hw) {
//         data = findResizeIndex(grid, 'column-header', y);
//       }

//       // Return the match if found.
//       if (data) {
//         return { group: 'column-header', index: data.index, delta: data.delta };
//       }

//       // Otherwise, there was no match.
//       return null;
//     }

//     // Test for a match in the column header second.
//     if (y <= hh) {
//       // Convert the position into unscrolled coordinates.
//       let pos = x + grid.scrollX - hw;

//       // Check for a match.
//       let data = findResizeIndex(grid, 'column', pos);

//       // Return the column match if found.
//       if (data) {
//         return { group: 'column', index: data.index, delta: data.delta };
//       }

//       // Otherwise, there was no match.
//       return null;
//     }

//     // Test for a match in the row header last.
//     if (x <= hw) {
//       // Convert the position into unscrolled coordinates.
//       let pos = y + grid.scrollY - hh;

//       // Check for a match.
//       let data = findResizeIndex(grid, 'row', pos);

//       // Return the row match if found.
//       if (data) {
//         return { group: 'row', index: data.index, delta: data.delta };
//       }

//       // Otherwise, there was no match.
//       return null;
//     }

//     // Otherwise, there was no match.
//     return null;
//   }

//   /**
//    * Resize a section in the data grid.
//    *
//    * @param grid - The data grid of interest.
//    *
//    * @param handle - The resize handle for the section of interest.
//    *
//    * @param clientX - The current client X mouse position.
//    *
//    * @param clientY - The current client Y mouse position.
//    */
//   export
//   function resizeSection(grid: DataGrid, handle: IResizeHandle, clientX: number, clientY: number): void {
//     // Look up the unscrolled offset for the handle.
//     let offset = grid.sectionOffset(handle.group, handle.index);

//     // Bail early if the handle no longer exists.
//     if (offset < 0) {
//       return;
//     }

//     // Convert the client position to viewport coordinates.
//     let rect = grid.viewportClientRect();
//     let x = clientX - rect.left;
//     let y = clientY - rect.top;

//     // Convert to unscrolled position.
//     let pos: number;
//     switch (handle.group) {
//     case 'row':
//       pos = y + grid.scrollY - grid.headerHeight;
//       break;
//     case 'column':
//       pos = x + grid.scrollX - grid.headerWidth;
//       break;
//     case 'row-header':
//       pos = x;
//       break;
//     case 'column-header':
//       pos = y;
//       break;
//     default:
//       throw 'unreachable';
//     }

//     // Compute the new size for the section.
//     let size = Math.max(4, pos - handle.delta - offset);

//     // Resize the section to the computed size.
//     grid.resizeSection(handle.group, handle.index, size);
//   }

//   /**
//    * Find the index of the resize handle at the given position.
//    *
//    * This accounts for `3px` of space on either side of a grid line,
//    * for a total of `7px` handle width.
//    *
//    * Returns the `{ index, delta }` match or `null`.
//    */
//   function findResizeIndex(grid: DataGrid, group: DataGrid.SectionGroup, pos: number): { index: number, delta: number } | null {
//     // Fetch the section count and length.
//     let sectionCount = grid.sectionCount(group);
//     let sectionLength = grid.sectionLength(group);

//     // Bail early if the section is empty or the position is invalid.
//     if (sectionCount === 0 || pos < 0) {
//       return null;
//     }

//     // Compute the delta from the end of the section.
//     let d1 = pos - (sectionLength - 1);

//     // Bail if the position is out of range.
//     if (d1 > 3) {
//       return null;
//     }

//     // Test whether the hover is just past the last section.
//     if (d1 >= 0) {
//       return { index: sectionCount - 1, delta: d1 };
//     }

//     // Find the section at the given position.
//     let i = grid.sectionIndex(group, pos);

//     // Look up the offset for the section.
//     let offset = grid.sectionOffset(group, i);

//     // Compute the delta to the previous border.
//     let d2 = pos - (offset - 1);

//     // Test whether the position hovers the previous border.
//     if (i > 0 && d2 <= 3) {
//       return { index: i - 1, delta: d2 };
//     }

//     // Look up the size of the section.
//     let size = grid.sectionSize(group, i);

//     // Compute the delta to the next border.
//     let d3 = (size + offset - 1) - pos;

//     // Test whether the position hovers the section border.
//     if (d3 <= 3) {
//       return { index: i, delta: -d3 };
//     }

//     // Otherwise, no resize border is hovered.
//     return null;
//   }

//   /**
//    * A mapping of resize handle types to cursor values.
//    */
//   const cursorMap = {
//     'row': 'ns-resize',
//     'column': 'ew-resize',
//     'row-header': 'ew-resize',
//     'column-header': 'ns-resize'
//   };
// }
