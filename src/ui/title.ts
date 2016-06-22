/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, defineSignal
} from '../core/signaling';


/**
 * An object which holds data related to a widget's title.
 *
 * #### Notes
 * A title object is intended to hold the data necessary to display a
 * header for a particular widget. A common example is the `TabPanel`,
 * which uses the widget title to populate the tab for a child widget.
 */
export
class Title {
  /**
   * Construct a new title.
   *
   * @param options - The options for initializing the title.
   */
  constructor(options: Title.IOptions = {}) {
    if (options.owner !== void 0) {
      this._owner = options.owner;
    }
    if (options.label !== void 0) {
      this._label = options.label;
    }
    if (options.mnemonic !== void 0) {
      this._mnemonic = options.mnemonic;
    }
    if (options.icon !== void 0) {
      this._icon = options.icon;
    }
    if (options.caption !== void 0) {
      this._caption = options.caption;
    }
    if (options.closable !== void 0) {
      this._closable = options.closable;
    }
    if (options.className !== void 0) {
      this._className = options.className;
    }
  }

  /**
   * A signal emitted when the state of the title changes.
   */
  changed: ISignal<Title, void>;

  /**
   * Get the object which owns the title.
   *
   * #### Notes
   * This will be `null` if the title has no owner.
   *
   * This is a read-only property.
   */
  get owner(): any {
    return this._owner;
  }

  /**
   * Get the label for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get label(): string {
    return this._label;
  }

  /**
   * Set the label for the title.
   */
  set label(value: string) {
    if (this._label === value) {
      return;
    }
    this._label = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the mnemonic index for the title.
   *
   * #### Notes
   * The default value is `-1`.
   */
  get mnemonic(): number {
    return this._mnemonic;
  }

  /**
   * Set the mnemonic index for the title.
   */
  set mnemonic(value: number) {
    if (this._mnemonic === value) {
      return;
    }
    this._mnemonic = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the icon class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get icon(): string {
    return this._icon;
  }

  /**
   * Set the icon class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set icon(value: string) {
    if (this._icon === value) {
      return;
    }
    this._icon = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the caption for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get caption(): string {
    return this._caption;
  }

  /**
   * Set the caption for the title.
   */
  set caption(value: string) {
    if (this._caption === value) {
      return;
    }
    this._caption = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the extra class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get className(): string {
    return this._className;
  }

  /**
   * Set the extra class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set className(value: string) {
    if (this._className === value) {
      return;
    }
    this._className = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the closable state for the title.
   *
   * #### Notes
   * The default value is `false`.
   */
  get closable(): boolean {
    return this._closable;
  }

  /**
   * Set the closable state for the title.
   *
   * #### Notes
   * This controls the presence of a close icon when applicable.
   */
  set closable(value: boolean) {
    if (this._closable === value) {
      return;
    }
    this._closable = value;
    this.changed.emit(void 0);
  }

  private _label = '';
  private _icon = '';
  private _caption = '';
  private _mnemonic = -1;
  private _className = '';
  private _closable = false;
  private _owner: any = null;
}


// Define the signals for the `Title` class.
defineSignal(Title.prototype, 'changed');


/**
 * The namespace for the `Title` class statics.
 */
export
namespace Title {
  /**
   * An options object for initializing a title.
   */
  export
  interface IOptions {
    /**
     * The object which owns the title.
     */
    owner?: any;

    /**
     * The label for the title.
     */
    label?: string;

    /**
     * The mnemonic index for the title.
     */
    mnemonic?: number;

    /**
     * The icon class for the title.
     */
    icon?: string;

    /**
     * The caption for the title.
     */
    caption?: string;

    /**
     * The extra class name for the title.
     */
    className?: string;

    /**
     * The closable state for the title.
     */
    closable?: boolean;
  }
}
