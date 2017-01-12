/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DisposableDelegate, IDisposable
} from '@phosphor/disposable';

import {
  MimeData
} from '@phosphor/mime';


/**
 * A type alias which defines the possible independent drop actions.
 */
export
type DropAction = 'none' | 'copy' | 'link' | 'move';


/**
 * A type alias which defines the possible supported drop actions.
 */
export
type SupportedActions = DropAction | 'copy-link' | 'copy-move' | 'link-move' | 'all';


/**
 * A custom event type used for drag-drop operations.
 *
 * #### Notes
 * In order to receive `'p-dragover'`, `'p-dragleave'`, or `'p-drop'`
 * events, a drop target must cancel the `'p-dragenter'` event by
 * calling the event's `preventDefault()` method.
 */
export
interface IDragEvent extends MouseEvent {
  /**
   * The drop action supported or taken by the drop target.
   *
   * #### Notes
   * At the start of each event, this value will be `'none'`. During a
   * `'p-dragover'` event, the drop target must set this value to one
   * of the supported actions, or the drop event will not occur.
   *
   * When handling the drop event, the drop target should set this
   * to the action which was *actually* taken. This value will be
   * reported back to the drag initiator.
   */
  dropAction: DropAction;

  /**
   * The drop action proposed by the drag initiator.
   *
   * #### Notes
   * This is the action which is *preferred* by the drag initiator. The
   * drop target is not required to perform this action, but should if
   * it all possible.
   */
  readonly proposedAction: DropAction;

  /**
   * The drop actions supported by the drag initiator.
   *
   * #### Notes
   * If the `dropAction` is not set to one of the supported actions
   * during the `'p-dragover'` event, the drop event will not occur.
   */
  readonly supportedActions: SupportedActions;

  /**
   * The mime data associated with the event.
   *
   * #### Notes
   * This is mime data provided by the drag initiator. Drop targets
   * should use this data to determine if they can handle the drop.
   */
  readonly mimeData: MimeData;

  /**
   * The source object of the drag, as provided by the drag initiator.
   *
   * #### Notes
   * For advanced applications, the drag initiator may wish to expose
   * a source object to the drop targets. That will be provided here
   * if given by the drag initiator, otherwise it will be `null`.
   */
  readonly source: any;
}


/**
 * An object which manages a drag-drop operation.
 *
 * A drag object dispatches four different events to drop targets:
 *
 * - `'p-dragenter'` - Dispatched when the mouse enters the target
 *   element. This event must be canceled in order to receive any
 *   of the other events.
 *
 * - `'p-dragover'` - Dispatched when the mouse moves over the drop
 *   target. It must cancel the event and set the `dropAction` to one
 *   of the supported actions in order to receive drop events.
 *
 * - `'p-dragleave'` - Dispatched when the mouse leaves the target
 *   element. This includes moving the mouse into child elements.
 *
 * - `'p-drop'`- Dispatched when the mouse is released over the target
 *   element when the target indicates an appropriate drop action. If
 *   the event is canceled, the indicated drop action is returned to
 *   the initiator through the resolved promise.
 *
 * A drag operation can be terminated at any time by pressing `Escape`
 * or by disposing the drag object.
 *
 * #### Notes
 * This class is designed to be used when dragging and dropping custom
 * data *within* a single application. It is *not* a replacement for
 * the native drag-drop API. Instead, it provides an API which allows
 * drag operations to be initiated programmatically and enables the
 * transfer of arbitrary non-string objects; features which are not
 * possible with the native drag-drop API.
 */
export
class Drag implements IDisposable {
  /**
   * Construct a new drag object.
   *
   * @param options - The options for initializing the drag.
   */
  constructor(options: Drag.IOptions) {
    this.mimeData = options.mimeData;
    this.dragImage = options.dragImage || null;
    this.proposedAction = options.proposedAction || 'copy';
    this.supportedActions = options.supportedActions || 'all';
    this.source = options.source || null;
  }

  /**
   * Dispose of the resources held by the drag object.
   *
   * #### Notes
   * This will cancel the drag operation if it is active.
   */
  dispose(): void {
    // Do nothing if the drag object is already disposed.
    if (this._disposed) {
      return;
    }
    this._disposed = true;

    // If there is a current target, dispatch a drag leave event.
    if (this._currentTarget) {
      let event = Private.createMouseEvent('mouseup', -1, -1);
      Private.dispatchDragLeave(this, this._currentTarget, null, event);
    }

    // Finalize the drag object with `'none'`.
    this._finalize('none');
  }

  /**
   * The mime data for the drag object.
   */
  readonly mimeData: MimeData;

  /**
   * The drag image element for the drag object.
   */
  readonly dragImage: HTMLElement | null;

  /**
   * The proposed drop action for the drag object.
   */
  readonly proposedAction: DropAction;

  /**
   * The supported drop actions for the drag object.
   */
  readonly supportedActions: SupportedActions;

  /**
   * Get the drag source for the drag object.
   */
  readonly source: any;

  /**
   * Test whether the drag object is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Start the drag operation at the specified client position.
   *
   * @param clientX - The client X position for the drag start.
   *
   * @param clientY - The client Y position for the drag start.
   *
   * @returns A promise which resolves to the result of the drag.
   *
   * #### Notes
   * If the drag has already been started, the promise created by the
   * first call to `start` is returned.
   *
   * If the drag operation has ended, or if the drag object has been
   * disposed, the returned promise will resolve to `'none'`.
   *
   * The drag object will be automatically disposed when drag operation
   * completes. This means `Drag` objects are for single-use only.
   *
   * This method assumes the left mouse button is already held down.
   */
  start(clientX: number, clientY: number): Promise<DropAction> {
    // If the drag object is already disposed, resolve to `None`.
    if (this._disposed) {
      return Promise.resolve('none');
    }

    // If the drag has already been started, return the promise.
    if (this._promise) {
      return this._promise;
    }

    // Install the document listeners for the drag object.
    this._addListeners();

    // Attach the drag image at the specified client position.
    this._attachDragImage(clientX, clientY);

    // Create the promise which will be resolved on completion.
    this._promise = new Promise<DropAction>((resolve, reject) => {
      this._resolve = resolve;
    });

    // Trigger a fake move event to kick off the drag operation.
    let event = Private.createMouseEvent('mousemove', clientX, clientY);
    document.dispatchEvent(event);

    // Return the pending promise for the drag operation.
    return this._promise;
  }

  /**
   * Handle the DOM events for the drag operation.
   *
   * @param event - The DOM event sent to the drag object.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the document. It should not be
   * called directly by user code.
   */
  handleEvent(event: Event): void {
    switch(event.type) {
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    default:
      // Stop all other events during drag-drop.
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * Handle the `'mousemove'` event for the drag object.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Stop all input events during drag-drop.
    event.preventDefault();
    event.stopPropagation();

    // Update the current target node and dispatch enter/leave events.
    this._updateCurrentTarget(event);

    // Move the drag image to the specified client position. This is
    // performed *after* dispatching to prevent unnecessary reflows.
    this._moveDragImage(event.clientX, event.clientY);
  }

  /**
   * Handle the `'mouseup'` event for the drag object.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Stop all input events during drag-drop.
    event.preventDefault();
    event.stopPropagation();

    // Do nothing if the left button is not released.
    if (event.button !== 0) {
      return;
    }

    // Update the current target node and dispatch enter/leave events.
    // This prevents a subtle issue where the DOM mutates under the
    // cursor after the last move event but before the drop event.
    this._updateCurrentTarget(event);

    // If there is no current target, finalize with `'none'`.
    if (!this._currentTarget) {
      this._finalize('none');
      return;
    }

    // If the last drop action was `'none'`, dispatch a leave event
    // to the current target and finalize the drag with `'none'`.
    if (this._dropAction === 'none') {
      Private.dispatchDragLeave(this, this._currentTarget, null, event);
      this._finalize('none');
      return;
    }

    // Dispatch the drop event at the current target and finalize
    // with the resulting drop action.
    let action = Private.dispatchDrop(this, this._currentTarget, event);
    this._finalize(action);
  }

  /**
   * Handle the `'keydown'` event for the drag object.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag-drop.
    event.preventDefault();
    event.stopPropagation();

    // Cancel the drag if `Escape` is pressed.
    if (event.keyCode === 27) {
      this.dispose();
    }
  }

  /**
   * Add the document event listeners for the drag object.
   */
  private _addListeners(): void {
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mouseenter', this, true);
    document.addEventListener('mouseleave', this, true);
    document.addEventListener('mouseover', this, true);
    document.addEventListener('mouseout', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('keyup', this, true);
    document.addEventListener('keypress', this, true);
    document.addEventListener('contextmenu', this, true);
  }

  /**
   * Remove the document event listeners for the drag object.
   */
  private _removeListeners(): void {
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mouseenter', this, true);
    document.removeEventListener('mouseleave', this, true);
    document.removeEventListener('mouseover', this, true);
    document.removeEventListener('mouseout', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('keyup', this, true);
    document.removeEventListener('keypress', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Update the current target node using the given mouse event.
   */
  private _updateCurrentTarget(event: MouseEvent): void {
    // Fetch common local state.
    let prevTarget = this._currentTarget;
    let currTarget = this._currentTarget;
    let prevElem = this._currentElement;

    // Find the current indicated element at the given position.
    let currElem = document.elementFromPoint(event.clientX, event.clientY);

    // Update the current element reference.
    this._currentElement = currElem;

    // Note: drag enter fires *before* drag leave according to spec.
    // https://html.spec.whatwg.org/multipage/interaction.html#drag-and-drop-processing-model

    // If the indicated element changes from the previous iteration,
    // and is different from the current target, dispatch the enter
    // events and compute the new target element.
    if (currElem !== prevElem && currElem !== currTarget) {
      currTarget = Private.dispatchDragEnter(this, currElem, currTarget, event);
    }

    // If the current target element has changed, update the current
    // target reference and dispatch the leave event to the old target.
    if (currTarget !== prevTarget) {
      this._currentTarget = currTarget;
      Private.dispatchDragLeave(this, prevTarget, currTarget, event);
    }

    // Dispatch the drag over event and update the drop action.
    let action = Private.dispatchDragOver(this, currTarget, event);
    this._setDropAction(action);
  }

  /**
   * Attach the drag image element at the specified location.
   *
   * This is a no-op if there is no drag image element.
   */
  private _attachDragImage(clientX: number, clientY: number): void {
    if (!this.dragImage) {
      return;
    }
    this.dragImage.classList.add(Drag.DRAG_IMAGE_CLASS);
    let style = this.dragImage.style;
    style.pointerEvents = 'none';
    style.position = 'absolute';
    style.top = `${clientY}px`;
    style.left = `${clientX}px`;
    document.body.appendChild(this.dragImage);
  }

  /**
   * Move the drag image element to the specified location.
   *
   * This is a no-op if there is no drag image element.
   */
  private _moveDragImage(clientX: number, clientY: number): void {
    if (!this.dragImage) {
      return;
    }
    let style = this.dragImage.style;
    style.top = `${clientY}px`;
    style.left = `${clientX}px`;
  }

  /**
   * Detach the drag image element from the DOM.
   *
   * This is a no-op if there is no drag image element.
   */
  private _detachDragImage(): void {
    if (!this.dragImage) {
      return;
    }
    let parent = this.dragImage.parentNode;
    if (!parent) {
      return;
    }
    parent.removeChild(this.dragImage);
  }

  /**
   * Set the internal drop action state and update the drag cursor.
   */
  private _setDropAction(action: DropAction): void {
    action = Private.validateAction(action, this.supportedActions);
    if (this._override && this._dropAction === action) {
      return;
    }
    switch (action) {
    case 'none':
      this._dropAction = action;
      this._override = Drag.overrideCursor('no-drop');
      break;
    case 'copy':
      this._dropAction = action;
      this._override = Drag.overrideCursor('copy');
      break;
    case 'link':
      this._dropAction = action;
      this._override = Drag.overrideCursor('alias');
      break;
    case 'move':
      this._dropAction = action;
      this._override = Drag.overrideCursor('move');
      break;
    }
  }

  /**
   * Finalize the drag operation and resolve the drag promise.
   */
  private _finalize(action: DropAction): void {
    // Store the resolve function as a temp variable.
    let resolve = this._resolve;

    // Remove the document event listeners.
    this._removeListeners();

    // Detach the drag image.
    this._detachDragImage();

    // Dispose of the cursor override.
    if (this._override) {
      this._override.dispose();
      this._override = null;
    }

    // Clear the mime data.
    this.mimeData.clear();

    // Clear the rest of the internal drag state.
    this._disposed = true;
    this._dropAction = 'none';
    this._currentTarget = null;
    this._currentElement = null;
    this._promise = null;
    this._resolve = null;

    // Finally, resolve the promise to the given drop action.
    if (resolve) {
      resolve(action);
    }
  }

  private _disposed = false;
  private _dropAction: DropAction = 'none';
  private _override: IDisposable | null = null;
  private _currentTarget: Element | null = null;
  private _currentElement: Element | null = null;
  private _promise: Promise<DropAction> | null = null;
  private _resolve: ((value: DropAction) => void) | null = null;
}


/**
 * The namespace for the `Drag` class statics.
 */
export
namespace Drag {
  /**
   * An options object for initializing a `Drag` object.
   */
  export
  interface IOptions {
    /**
     * The populated mime data for the drag operation.
     */
    mimeData: MimeData;

    /**
     * An optional drag image which follows the mouse cursor.
     *
     * #### Notes
     * The drag image can be any DOM element. It is not limited to
     * image or canvas elements as with the native drag-drop APIs.
     *
     * If provided, this will be positioned at the mouse cursor on each
     * mouse move event. A CSS transform can be used to offset the node
     * from its specified position.
     *
     * The drag image will automatically have the `p-mod-drag-image`
     * class name added.
     *
     * The default value is `null`.
     */
    dragImage?: HTMLElement;

    /**
     * The optional proposed drop action for the drag operation.
     *
     * #### Notes
     * This can be provided as a hint to the drop targets as to which
     * drop action is preferred.
     *
     * The default value is `'copy'`.
     */
    proposedAction?: DropAction;

    /**
     * The drop actions supported by the drag initiator.
     *
     * #### Notes
     * A drop target must indicate that it intends to perform one of the
     * supported actions in order to receive a drop event. However, it is
     * not required to *actually* perform that action when handling the
     * drop event. Therefore, the initiator must be prepared to handle
     * any drop action performed by a drop target.
     *
     * The default value is `'all'`.
     */
    supportedActions?: SupportedActions;

    /**
     * An optional object which indicates the source of the drag.
     *
     * #### Notes
     * For advanced applications, the drag initiator may wish to expose
     * a source object to the drop targets. That object can be specified
     * here and will be carried along with the drag events.
     *
     * The default value is `null`.
     */
    source?: any;
  }

  /**
   * The class name added to drag image nodes.
   */
  export
  const DRAG_IMAGE_CLASS = 'p-mod-drag-image';

  /**
   * The class name added to the document body during cursor override.
   */
  export
  const OVERRIDE_CURSOR_CLASS = 'p-mod-override-cursor';

  /**
   * Override the cursor icon for the entire document.
   *
   * @param cursor - The string representing the cursor style.
   *
   * @returns A disposable which will clear the override when disposed.
   *
   * #### Notes
   * The most recent call to `overrideCursor` takes precedence.
   * Disposing an old override has no effect on the current override.
   *
   * This utility function is used by the `Drag` class to override the
   * mouse cursor during a drag-drop operation, but it can also be used
   * by other classes to fix the cursor icon during normal mouse drags.
   *
   * #### Example
   * ```typescript
   * import { Drag } from '@phosphor/dragdrop';
   *
   * // Force the cursor to be 'wait' for the entire document.
   * let override = Drag.overrideCursor('wait');
   *
   * // Clear the override by disposing the return value.
   * override.dispose();
   * ```
   */
  export
  function overrideCursor(cursor: string): IDisposable {
    let id = ++overrideCursorID;
    document.body.style.cursor = cursor;
    document.body.classList.add(OVERRIDE_CURSOR_CLASS);
    return new DisposableDelegate(() => {
      if (id === overrideCursorID) {
        document.body.style.cursor = '';
        document.body.classList.remove(OVERRIDE_CURSOR_CLASS);
      }
    });
  }

  /**
   * The internal id for the active cursor override.
   */
  let overrideCursorID = 0;
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Validate the given action is one of the supported actions.
   *
   * Returns the given action or `'none'` if the action is unsupported.
   */
  export
  function validateAction(action: DropAction, supported: SupportedActions): DropAction {
    return (actionTable[action] & supportedTable[supported]) ? action : 'none';
  }

  /**
   * Create a left mouse event at the given position.
   *
   * @param type - The event type for the mouse event.
   *
   * @param clientX - The client X position.
   *
   * @param clientY - The client Y position.
   *
   * @returns A newly created and initialized mouse event.
   */
  export
  function createMouseEvent(type: string, clientX: number, clientY: number): MouseEvent {
    let event = document.createEvent('MouseEvent');
    event.initMouseEvent(type, true, true, window, 0, 0, 0,
      clientX, clientY, false, false, false, false, 0, null);
    return event;
  }

  /**
   * Dispatch a drag enter event to the indicated element.
   *
   * @param drag - The drag object associated with the action.
   *
   * @param currElem - The currently indicated element, or `null`. This
   *   is the "immediate user selection" from the whatwg spec.
   *
   * @param currTarget - The current drag target element, or `null`. This
   *   is the "current target element" from the whatwg spec.
   *
   * @param event - The mouse event related to the action.
   *
   * @returns The element to use as the current drag target. This is the
   *   "current target element" from the whatwg spec, and may be `null`.
   *
   * #### Notes
   * This largely implements the drag enter portion of the whatwg spec:
   * https://html.spec.whatwg.org/multipage/interaction.html#drag-and-drop-processing-model
   */
  export
  function dispatchDragEnter(drag: Drag, currElem: Element | null, currTarget: Element | null, event: MouseEvent): Element | null {
    // If the current element is null, return null as the new target.
    if (!currElem) {
      return null;
    }

    // Dispatch a drag enter event to the current element.
    let dragEvent = createDragEvent('p-dragenter', drag, event, currTarget);
    let canceled = !currElem.dispatchEvent(dragEvent);

    // If the event was canceled, use the current element as the new target.
    if (canceled) {
      return currElem;
    }

    // If the current element is the document body, keep the original target.
    if (currElem === document.body) {
      return currTarget;
    }

    // Dispatch a drag enter event on the document body.
    dragEvent = createDragEvent('p-dragenter', drag, event, currTarget);
    document.body.dispatchEvent(dragEvent);

    // Ignore the event cancellation, and use the body as the new target.
    return document.body;
  }

  /**
   * Dispatch a drag leave event to the indicated element.
   *
   * @param drag - The drag object associated with the action.
   *
   * @param prevTarget - The previous target element, or `null`. This
   *   is the previous "current target element" from the whatwg spec.
   *
   * @param currTarget - The current drag target element, or `null`. This
   *   is the "current target element" from the whatwg spec.
   *
   * @param event - The mouse event related to the action.
   *
   * #### Notes
   * This largely implements the drag leave portion of the whatwg spec:
   * https://html.spec.whatwg.org/multipage/interaction.html#drag-and-drop-processing-model
   */
  export
  function dispatchDragLeave(drag: Drag, prevTarget: Element | null, currTarget: Element | null, event: MouseEvent): void {
    // If the previous target is null, do nothing.
    if (!prevTarget) {
      return;
    }

    // Dispatch the drag leave event to the previous target.
    let dragEvent = createDragEvent('p-dragleave', drag, event, currTarget);
    prevTarget.dispatchEvent(dragEvent);
  }

  /**
   * Dispatch a drag over event to the indicated element.
   *
   * @param drag - The drag object associated with the action.
   *
   * @param currTarget - The current drag target element, or `null`. This
   *   is the "current target element" from the whatwg spec.
   *
   * @param event - The mouse event related to the action.
   *
   * @returns The `DropAction` result of the drag over event.
   *
   * #### Notes
   * This largely implements the drag over portion of the whatwg spec:
   * https://html.spec.whatwg.org/multipage/interaction.html#drag-and-drop-processing-model
   */
  export
  function dispatchDragOver(drag: Drag, currTarget: Element | null, event: MouseEvent): DropAction {
    // If there is no current target, the drop action is none.
    if (!currTarget) {
      return 'none';
    }

    // Dispatch the drag over event to the current target.
    let dragEvent = createDragEvent('p-dragover', drag, event, null);
    let canceled = !currTarget.dispatchEvent(dragEvent);

    // If the event was canceled, return the drop action result.
    if (canceled) {
      return dragEvent.dropAction;
    }

    // Otherwise, the effective drop action is none.
    return 'none';
  }

  /**
   * Dispatch a drop event to the indicated element.
   *
   * @param drag - The drag object associated with the action.
   *
   * @param currTarget - The current drag target element, or `null`. This
   *   is the "current target element" from the whatwg spec.
   *
   * @param event - The mouse event related to the action.
   *
   * @returns The `DropAction` result of the drop event.
   *
   * #### Notes
   * This largely implements the drag over portion of the whatwg spec:
   * https://html.spec.whatwg.org/multipage/interaction.html#drag-and-drop-processing-model
   */
  export
  function dispatchDrop(drag: Drag, currTarget: Element | null, event: MouseEvent): DropAction {
    // If there is no current target, the drop action is none.
    if (!currTarget) {
      return 'none';
    }

    // Dispatch the drop event to the current target.
    let dragEvent = createDragEvent('p-drop', drag, event, null);
    let canceled = !currTarget.dispatchEvent(dragEvent);

    // If the event was canceled, return the drop action result.
    if (canceled) {
      return dragEvent.dropAction;
    }

    // Otherwise, the effective drop action is none.
    return 'none';
  }

  /**
   * A lookup table from drop action to bit value.
   */
  const actionTable: { [key: string]: number } = {
    'none': 0x0,
    'copy': 0x1,
    'link': 0x2,
    'move': 0x4
  };

  /**
   * A lookup table from supported action to drop action bit mask.
   */
  const supportedTable: { [key: string]: number } = {
    'none': actionTable['none'],
    'copy': actionTable['copy'],
    'link': actionTable['link'],
    'move': actionTable['move'],
    'copy-link': actionTable['copy'] | actionTable['link'],
    'copy-move': actionTable['copy'] | actionTable['move'],
    'link-move': actionTable['link'] | actionTable['move'],
    'all': actionTable['copy'] | actionTable['link'] | actionTable['move']
  };

  /**
   * Create a new initialized `IDragEvent` from the given data.
   *
   * @param type - The event type for the drag event.
   *
   * @param drag - The drag object to use for seeding the drag data.
   *
   * @param event - The mouse event to use for seeding the mouse data.
   *
   * @param related - The related target for the event, or `null`.
   *
   * @returns A new object which implements `IDragEvent`.
   */
  function createDragEvent(type: string, drag: Drag, event: MouseEvent, related: Element | null): IDragEvent {
    // Create a new mouse event to use as the drag event. Currently,
    // JS engines do now allow user-defined Event subclasses.
    let dragEvent = document.createEvent('MouseEvent');

    // Initialize the mouse event data.
    dragEvent.initMouseEvent(
      type, true, true, window, 0,
      event.screenX, event.screenY,
      event.clientX, event.clientY,
      event.ctrlKey, event.altKey,
      event.shiftKey, event.metaKey,
      event.button, related
    );

    // Forcefully add the custom drag event properties.
    (dragEvent as any).dropAction = 'none';
    (dragEvent as any).mimeData = drag.mimeData;
    (dragEvent as any).proposedAction = drag.proposedAction;
    (dragEvent as any).supportedActions = drag.supportedActions;
    (dragEvent as any).source = drag.source;

    // Return the fully initialized drag event.
    return dragEvent as IDragEvent;
  }
}
