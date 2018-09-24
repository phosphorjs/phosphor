/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  ListField
} from './listfield';

import {
  MapField
} from './mapfield';

import {
  RegisterField
} from './registerfield';

import {
  TextField
} from './textfield';


/**
 * The namespace for the `Fields` factory functions.
 */
export
namespace Fields {
  /**
   * A factory function which creates a boolean register field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `false`.
   *
   * @returns A new boolean register field.
   */
  export
  function Boolean(options: Partial<RegisterField.IOptions<boolean>> = {}): RegisterField<boolean> {
    return new RegisterField<boolean>({ value: false, ...options });
  }

  /**
   * A factory function which creates a number register field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `0`.
   *
   * @returns A new number register field.
   */
  export
  function Number(options: Partial<RegisterField.IOptions<number>> = {}): RegisterField<number> {
    return new RegisterField<number>({ value: 0, ...options });
  }

  /**
   * A factory function which creates a string register field.
   *
   * @param options - The options for the field. The default `value`
   *   option is `''`.
   *
   * @returns A new string register field.
   */
  export
  function String(options: Partial<RegisterField.IOptions<string>> = {}): RegisterField<string> {
    return new RegisterField<string>({ value: '', ...options });
  }

  /**
   * A factory function which creates a list field.
   *
   * @param options - The options for the field.
   *
   * @returns A new list field.
   */
  export
  function List<T extends ReadonlyJSONValue>(options: ListField.IOptions<T> = {}): ListField<T> {
    return new ListField<T>(options);
  }

  /**
   * A factory function which creates a map field.
   *
   * @param options - The options for the field.
   *
   * @returns A new map field.
   */
  export
  function Map<T extends ReadonlyJSONValue>(options: MapField.IOptions<T> = {}): MapField<T> {
    return new MapField<T>(options);
  }

  /**
   * A factory function which creates a register field.
   *
   * @param options - The options for the field.
   *
   * @returns A new register field.
   */
  export
  function Register<T extends ReadonlyJSONValue>(options: RegisterField.IOptions<T>): RegisterField<T> {
    return new RegisterField<T>(options);
  }

  /**
   * A factory function which creates a text field.
   *
   * @param options - The options for the field.
   *
   * @returns A new text field.
   */
  export
  function Text(options: TextField.IOptions = {}): TextField {
    return new TextField(options);
  }
}
