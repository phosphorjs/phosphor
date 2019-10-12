/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';

import { VirtualElementPass } from "@phosphor/virtualdom";


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
      this._iconClass = options.icon;
    }
    if (options.iconClass !== undefined) {
      this._iconClass = options.iconClass;
    }
    if (options.iconLabel !== undefined) {
      this._iconLabel = options.iconLabel;
    }
    if (options.iconPass !== undefined) {
      this._iconPass = options.iconPass;
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
    this._dataset = options.dataset || {};
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
   * @deprecated Use `iconClass` instead.
   */
  get icon(): string {
    return this.iconClass;
  }

  /**
   * @deprecated Use `iconClass` instead.
   */
  set icon(value: string) {
    this.iconClass = value;
  }

  /**
   * Get the icon class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get iconClass(): string {
    return this._iconClass;
  }

  /**
   * Set the icon class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set iconClass(value: string) {
    if (this._iconClass === value) {
      return;
    }
    this._iconClass = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the icon label for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get iconLabel(): string {
    return this._iconLabel;
  }

  /**
   * Set the icon label for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set iconLabel(value: string) {
    if (this._iconLabel === value) {
      return;
    }
    this._iconLabel = value;
    this._changed.emit(undefined);
  }

  get iconPass(): VirtualElementPass.IProps {
    return this._iconPass;
  }

  set iconPass(value: VirtualElementPass.IProps) {
    if (this._iconPass === value) {
      return;
    }
    this._iconPass = value;
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
   * Get the dataset for the title.
   *
   * #### Notes
   * The default value is an empty dataset.
   */
  get dataset(): Title.Dataset {
    return this._dataset;
  }

  /**
   * Set the dataset for the title.
   *
   * #### Notes
   * This controls the data attributes when applicable.
   */
  set dataset(value: Title.Dataset) {
    if (this._dataset === value) {
      return;
    }
    this._dataset = value;
    this._changed.emit(undefined);
  }

  private _label = '';
  private _caption = '';
  private _mnemonic = -1;
  private _iconClass = '';
  private _iconLabel = '';
  private _iconPass: VirtualElementPass.IProps;
  private _className = '';
  private _closable = false;
  private _dataset: Title.Dataset;
  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the `Title` class statics.
 */
export
namespace Title {
  /**
   * A type alias for a simple immutable string dataset.
   */
  export
  type Dataset = { readonly [key: string]: string };

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
     * @deprecated Use `iconClass` instead.
     */
    icon?: string;

    /**
     * The icon class name for the title.
     */
    iconClass?: string;

    /**
     * The icon label for the title.
     */
    iconLabel?: string;

    iconPass?: VirtualElementPass.IProps;

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
     * The dataset for the title.
     */
    dataset?: Dataset;
  }
}
