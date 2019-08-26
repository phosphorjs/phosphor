/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 *
 */
class DefaultHandler implements EventHandler.IProxy {
  /**
   * Handle the key down event for the `'default'` state.
   *
   * @param event - The keyboard event of interest.
   *
   * ##### Notes
   * This method dispatches to individual key press handlers.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onKeyDown(event: KeyboardEvent): void {
    // Get the canonical key for the keyboard event.
    let key = getKeyboardLayout().keyForKeydownEvent(event);

    // Dispatch based on the key.
    switch (key) {
    case 'ArrowLeft':
      this.default_onArrowLeft(event);
      break;
    case 'ArrowRight':
      this.default_onArrowRight(event);
      break;
    case 'ArrowUp':
      this.default_onArrowUp(event);
      break;
    case 'ArrowDown':
      this.default_onArrowDown(event);
      break;
    case 'PageUp':
      this.default_onPageUp(event);
      break;
    case 'PageDown':
      this.default_onPageDown(event);
      break;
    default:
      break;
    }
  }

  /**
   * Handle the `'ArrowLeft'` key press for the data grid.
   *
   * @param event
   */
  protected default_onArrowLeft(event: KeyboardEvent): void {

  }

  /**
   * Handle the `'ArrowRight'` key press for the data grid.
   *
   * @param event
   */
  protected default_onArrowRight(event: KeyboardEvent): void {

  }

  /**
   * Handle the `'ArrowUp'` key press for the data grid.
   *
   * @param event
   */
  protected default_onArrowUp(event: KeyboardEvent): void {

  }

  /**
   * Handle the `'ArrowDown'` key press for the data grid.
   *
   * @param event
   */
  protected default_onArrowDown(event: KeyboardEvent): void {

  }

  /**
   * Handle the `'PageUp'` key press for the data grid.
   *
   * @param event
   */
  protected default_onPageUp(event: KeyboardEvent): void {

  }

  /**
   * Handle the `'PageDown'` key press for the data grid.
   *
   * @param event
   */
  protected default_onPageDown(event: KeyboardEvent): void {

  }

  /**
   * Handle the mouse move event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this handler sets the mouse
   * cursor for the viewport, taking into account the various
   * behavior flags.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseMove(event: MouseEvent): void {
    // Hit test the grid.
    let hit = this.grid.hitTest(event.clientX, event.clientY);

    // Bail early if the position is out of bounds.
    if (!hit) {
      return;
    }

    // TODO alt cursor

    // TODO move cursor

    // Get the resize handle for the hit test.
    let handle = this.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

    // Update the viewport cursor based on the part.
    this.grid.viewport.node.style.cursor = cursor;
  }

  /**
   * Handle the mouse leave event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this handler clears the
   * viewport cursor.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseLeave(event: MouseEvent): void {
    this.grid.viewport.node.style.cursor = '';
  }

  /**
   * Handle the mouse down event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * @returns The new state for the handler.
   *
   * #### Notes
   * This method determines the new state for the handler, based
   * on where the mouse was pressed. If a state change results,
   * the mouse down handler for the new state will also be called.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseDown(event: MouseEvent): EventHandler.State {
    // Hit test the grid.
    let hit = this.grid.hitTest(event.clientX, event.clientY);

    //
    if (!hit) {
      return 'default';
    }

    //
    this.grid.activate();

    // Bail early if the hit was out of bounds.
    if (hit.region === 'void') {
      return 'default';
    }

    // Transition to the alternate mode if the alt key is held.
    if (event.altKey) {
      return 'alt';
    }

    // move transition

    // Get the resize handle for the hit test.
    let handle = this.resizeHandleForHitTest(hit);

    // Transition to the resize mode if possible.
    if (handle !== 'none') {
      return 'resize';
    }

    // Otherwise, transition to the select mode.
    return 'select';
  }

  /**
   * Handle the wheel event for the `'default'` state.
   *
   * @param event - The wheel event of interest.
   *
   * #### Notes
   * The defualt implementation scrolls the data grid.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onWheel(event: WheelEvent): void {
    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      let ds = this.grid.defaultSizes;
      dx *= ds.columnWidth;
      dy *= ds.rowHeight;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= this.grid.pageWidth;
      dy *= this.grid.pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Scroll by the desired amount.
    this.grid.scrollBy(dx, dy);
  }

  /**
   * Handle the context menu event for the `'default'` state.
   *
   * @param event - The context menu event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onContextMenu(event: MouseEvent): void { }
}
  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {

    // Bail early if not in the default state.
    if (this._state !== 'default') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Determine which state to enter.
    let state = this.default_onMouseDown(event);

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Bail early if still in the default state.
    if (state === 'default') {
      return;
    }

    // Update the internal state.
    this._state = state;

    // Dispatch based on the current state.
    switch (state) {
    case 'resize':
      this.resize_onMouseDown(event);
      break;
    case 'move':
      this.move_onMouseDown(event);
      break;
    case 'select':
      this.select_onMouseDown(event);
      break;
    case 'alt':
      this.alt_onMouseDown(event);
      break;
    default:
      throw 'unreachable';
    }

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Bail early if in the default state.
    if (this._state === 'default') {
      return;
    }

    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Dispatch based on the current mode.
    switch (this._state) {
    case 'resize':
      this.resize_onMouseUp(event);
      break;
    case 'move':
      this.move_onMouseUp(event);
      break;
    case 'select':
      this.select_onMouseUp(event);
      break;
    case 'alt':
      this.alt_onMouseUp(event);
      break;
    default:
      throw 'unreachable';
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Reset the state.
    this._state = 'default';

    // Remove the document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Dispatch based on the current state.
    switch (this._state) {
    case 'default':
      this.default_onMouseMove(event);
      break;
    case 'resize':
      this.resize_onMouseMove(event);
      break;
    case 'move':
      this.move_onMouseMove(event);
      break;
    case 'select':
      this.select_onMouseMove(event);
      break;
    case 'alt':
      this.alt_onMouseMove(event);
      break;
    default:
      throw 'unreachable';
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'mouseleave'` event for the data grid.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._state === 'default') {
      this.default_onMouseLeave(event);
    }
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Do nothing if the control key is held.
    if (event.ctrlKey) {
      return;
    }

    // Dispatch based on the state.
    switch (this._state) {
    case 'default':
      this.default_onWheel(event);
      break;
    case 'resize':
      this.resize_onWheel(event);
      break;
    case 'move':
      this.move_onWheel(event);
      break;
    case 'select':
      this.select_onWheel(event);
      break;
    case 'alt':
      this.alt_onWheel(event);
      break;
    default:
      throw 'unreachable';
    }

    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'contextmenu'` event for the data grid.
   */
  private _evtContextMenu(event: MouseEvent): void {
    if (this._state === 'default') {
      this.default_onContextMenu(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }


  /**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a resize handle into a cursor.
   */
  export
  function cursorForHandle(handle: EventHandler.ResizeHandle): string {
    return cursorMap[handle];
  }

  /**
   * A mapping of resize handle to cursor.
   */
  const cursorMap = {
    top: 'ns-resize',
    left: 'ew-resize',
    right: 'ew-resize',
    bottom: 'ns-resize',
    none: ''
  };
}

