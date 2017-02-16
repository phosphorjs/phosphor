/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';


/**
 * An object which holds data related to an object's title.
 *
 * #### Notes
 * A title object is intended to hold the data necessary to display a
 * header for a particular object. A common example is the `TabPanel`,
 * which uses the widget title to populate the tab for a child widget.
 */
export
class Title<T> {
  /**
   * Construct a new title.
   *
   * @param options - The options for initializing the title.
   */
  constructor(options: Title.IOptions<T>) {
    this.owner = options.owner;
    if (options.label !== undefined) {
      this._label = options.label;
    }
    if (options.mnemonic !== undefined) {
      this._mnemonic = options.mnemonic;
    }
    if (options.icon !== undefined) {
      this._icon = options.icon;
    }
    if (options.caption !== undefined) {
      this._caption = options.caption;
    }
    if (options.className !== undefined) {
      this._className = options.className;
    }
    if (options.closable !== undefined) {
      this._closable = options.closable;
    }
    if (options.dataset !== undefined) {
      Private.updateData(this._dataset, options.dataset);
    }
  }

  /**
   * A signal emitted when the state of the title changes.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The object which owns the title.
   */
  readonly owner: T;

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
    this._changed.emit(undefined);
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
    this._changed.emit(undefined);
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
    this._changed.emit(undefined);
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
    this._changed.emit(undefined);
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
    this._changed.emit(undefined);
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
    this._changed.emit(undefined);
  }

  /**
   * Get the data value for a data key.
   *
   * @param key - The data key of interest.
   *
   * @returns The value for the given key, or an empty string.
   *
   * #### Notes
   * The dataset is intended for advanced use cases where the other
   * properties on the title are insufficient to contain all of the
   * data needed to render the title for an object.
   */
  getData(key: string): string {
    return Private.getData(this._dataset, key);
  }

  /**
   * Set the data value for a data key.
   *
   * @param key - The data key of interest.
   *
   * @param value - The value to set for the data key.
   *
   * #### Notes
   * The dataset is intended for advanced use cases where the other
   * properties on the title are insufficient to contain all of the
   * data needed to render the title for an object.
   */
  setData(key: string, value: string): void {
    if (Private.setData(this._dataset, key, value)) {
      this._changed.emit(undefined);
    }
  }

  /**
   * Update the data values for multiple data keys.
   *
   * @param value - An object mapping of key/value pairs to update.
   *
   * #### Notes
   * The dataset is intended for advanced use cases where the other
   * properties on the title are insufficient to contain all of the
   * data needed to render the title for an object.
   */
  updateData(values: Title.Dataset): void {
    if (Private.updateData(this._dataset, values)) {
      this._changed.emit(undefined);
    }
  }

  private _icon = '';
  private _label = '';
  private _caption = '';
  private _mnemonic = -1;
  private _className = '';
  private _closable = false;
  private _changed = new Signal<this, void>(this);
  private _dataset: Title.Dataset = Object.create(null);
}


/**
 * The namespace for the `Title` class statics.
 */
export
namespace Title {
  /**
   * A type alias for a simple string dataset.
   */
  export
  type Dataset = { [key: string]: string };

  /**
   * An options object for initializing a title.
   */
  export
  interface IOptions<T> {
    /**
     * The object which owns the title.
     */
    owner: T;

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

    /**
     * The initial dataset for the title.
     */
    dataset?: Dataset;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Get the value for a dataset key.
   *
   * Returns an empty string if the key does not exist.
   */
  export
  function getData(dataset: Title.Dataset, key: string): string {
    return dataset[key] || '';
  }

  /**
   * Set the value for a dataset key.
   *
   * Returns whether the value was changed.
   */
  export
  function setData(dataset: Title.Dataset, key: string, value: string): boolean {
    if (value === (dataset[key] || '')) {
      return false;
    }
    if (value) {
      dataset[key] = value;
    } else {
      delete dataset[key];
    }
    return true;
  }

  /**
   * Update the values for a dataset.
   *
   * Returns whether any value was changed.
   */
  export
  function updateData(dataset: Title.Dataset, values: Title.Dataset): boolean {
    let changed = false;
    for (let key in values) {
      if (values[key] === (dataset[key] || '')) {
        continue;
      }
      if (values[key]) {
        dataset[key] = values[key];
      } else {
        delete dataset[key];
      }
      changed = true;
    }
    return changed;
  }
}
