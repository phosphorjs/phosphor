/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  Signal
} from '@phosphor/signaling';

import {
  DataGrid
} from './datagrid';


/**
 * A generic data grid event handler.
 *
 * #### Notes
 * This class makes some basic common assumptions about how events
 * should be handled, and dispatches the majority of its behavior
 * to proxy handlers.
 *
 * If this class is insufficient for a particular use case, a new
 * class may be defined. The grid has no dependency on this class.
 */
export
class EventHandler implements IDisposable {
  /**
   * Construct a new event handler object.
   *
   * @param options - The options for initializing the handler.
   */
  constructor(options: EventHandler.IOptions) {
    // Parse the options.
    this.grid = options.grid;
    this.keyHandler = options.keyHandler;
    this.mouseHandler = options.mouseHandler;

    // Tie the handler lifetime to the grid.
    this.grid.disposed.connect(() => { this.dispose(); });

    // Set up the viewport listeners.
    this.grid.viewport.node.addEventListener('keydown', this);
    this.grid.viewport.node.addEventListener('mousedown', this);
    this.grid.viewport.node.addEventListener('mousemove', this);
    this.grid.viewport.node.addEventListener('mouseleave', this);
    this.grid.viewport.node.addEventListener('contextmenu', this);

    // Set up the grid listeners.
    this.grid.node.addEventListener('wheel', this);

    // Set up the window listeners.
    window.addEventListener('resize', this);
  }

  /**
   * Dispose of the resources held by the event handler.
   */
  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    // Flip the disposed flag.
    this._disposed = true;

    // Reset the internal state.
    this._state = 'default';

    // Dispose of the handlers.
    this.keyHandler.dispose();
    this.mouseHandler.dispose();

    // Ensure the document listeners are removed.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Remove the viewport listeners.
    this.grid.viewport.node.removeEventListener('keydown', this);
    this.grid.viewport.node.removeEventListener('mousedown', this);
    this.grid.viewport.node.removeEventListener('mousemove', this);
    this.grid.viewport.node.removeEventListener('mouseleave', this);
    this.grid.viewport.node.removeEventListener('contextmenu', this);

    // Remove the grid listeners.
    this.grid.node.removeEventListener('wheel', this);

    // Remove the window listeners.
    window.removeEventListener('resize', this);

    // Clear the signal and message data.
    Signal.clearData(this);
  }

  /**
   * The data grid associated with this event handler.
   */
  readonly grid: DataGrid;

  /**
   * The key handler for the data grid.
   */
  readonly keyHandler: EventHandler.IKeyHandler;

  /**
   * The mouse handler for the data grid.
   */
  readonly mouseHandler: EventHandler.IMouseHandler;

  /**
   * Whether the event handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Handle the DOM events for the data grid.
   *
   * @param event - The DOM event sent to the data grid.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the data grid's DOM node. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
      break;
    case 'contextmenu':
      this._evtContextMenu(event as MouseEvent);
      break;
    case 'wheel':
      this._evtWheel(event as WheelEvent);
      break;
    case 'resize':
      this.grid.refreshDPI();
      break;
    }
  }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._state === 'mouse') {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.keyHandler.onKeyDown(this.grid, event);
    }
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);

    // Transition to the mouse capture state.
    this._state = 'mouse';

    // Dispatch to the mouse handler.
    this.mouseHandler.onMouseDown(this.grid, event);
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    if (this._state === 'mouse') {
      event.preventDefault();
      event.stopPropagation();
      this.mouseHandler.onMouseMove(this.grid, event);
    } else {
      this.mouseHandler.onMouseHover(this.grid, event);
    }
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Transition to the default state.
    this._state = 'default';

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Remove the document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Dispatch to the mouse handler.
    this.mouseHandler.onMouseUp(this.grid, event);
  }

  /**
   * Handle the `'mouseleave'` event for the data grid.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._state === 'mouse') {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.mouseHandler.onMouseLeave(this.grid, event);
    }
  }

  /**
   * Handle the `'contextmenu'` event for the data grid.
   */
  private _evtContextMenu(event: MouseEvent): void {
    if (this._state === 'mouse') {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.mouseHandler.onContextMenu(this.grid, event);
    }
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    if (this._state === 'mouse') {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.mouseHandler.onWheel(this.grid, event);
    }
  }

  private _disposed = false;
  private _state: 'default' | 'mouse' = 'default';
}


/**
 * The namespace for the `EventHandler` class statics.
 */
export
namespace EventHandler {
  /**
   * An object which handles keydown events for the data grid.
   */
  export
  interface IKeyHandler extends IDisposable {
    /**
     * Handle the key down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The keydown event of interest.
     *
     * #### Notes
     * This will not be called if the mouse button is pressed.
     */
    onKeyDown(grid: DataGrid, event: KeyboardEvent): void;
  }

  /**
   * An object which handles mouse events for the data grid.
   */
  export
  interface IMouseHandler extends IDisposable {
    /**
     * Handle the mouse hover event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseHover(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse leave event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseLeave(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse down event of interest.
     */
    onMouseDown(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse move event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse move event of interest.
     */
    onMouseMove(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse up event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse up event of interest.
     */
    onMouseUp(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the context menu event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The context menu event of interest.
     */
    onContextMenu(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the wheel event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The wheel event of interest.
     */
    onWheel(grid: DataGrid, event: WheelEvent): void;
  }

  /**
   * An options object for initializing an event handler.
   */
  export
  interface IOptions {
    /**
     * The data grid to associated with the event handler.
     */
    grid: DataGrid;

    /**
     * The key handler for the data grid.
     */
    keyHandler: IKeyHandler;

    /**
     * The mouse handler for the data grid.
     */
    mouseHandler: IMouseHandler;
  }
}
