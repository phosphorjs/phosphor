/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * A concrete implementation of IMessage.
 *
 * This may be subclassed to create complex message types.
 */
export
class Message implements IMessage {
  /**
   * Construct a new message.
   */
  constructor(type: string) {
    this._type = type;
  }

  /**
   * The type of the message.
   */
  get type(): string {
    return this._type;
  }

  private _type: string;
}

} // module phosphor.core
