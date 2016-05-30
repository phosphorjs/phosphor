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
  constructor(options?: Title.IOptions) {
    if (options === void 0) {
      return;
    }
    if (options.owner !== void 0) {
      this._owner = options.owner;
    }
    if (options.text !== void 0) {
      this._text = options.text;
    }
    if (options.mnemonic !== void 0) {
      this._mnemonic = options.mnemonic;
    }
    if (options.icon !== void 0) {
      this._icon = options.icon;
    }
    if (options.tooltip !== void 0) {
      this._tooltip = options.tooltip;
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
   * Get the text for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get text(): string {
    return this._text;
  }

  /**
   * Set the text for the title.
   */
  set text(value: string) {
    if (this._text === value) {
      return;
    }
    this._text = value;
    this.changed.emit(void 0);
  }

  /**
   * Get the mnemonic for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get mnemonic(): string {
    return this._text;
  }

  /**
   * Set the mnemonic for the title.
   */
  set mnemonic(value: string) {
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
   * Get the tooltip for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get tooltip(): string {
    return this._tooltip;
  }

  /**
   * Set the tooltip for the title.
   */
  set tooltip(value: string) {
    if (this._tooltip === value) {
      return;
    }
    this._tooltip = value;
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

  private _text = '';
  private _icon = '';
  private _tooltip = '';
  private _mnemonic = '';
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
     * The text for the title.
     */
    text?: string;

    /**
     * The mnemonic for the title.
     */
    mnemonic?: string;

    /**
     * The icon class for the title.
     */
    icon?: string;

    /**
     * The tooltip for the title.
     */
    tooltip?: string;

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
