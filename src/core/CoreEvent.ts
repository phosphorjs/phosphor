/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * A concrete implementation of ICoreEvent.
 */
export
class CoreEvent implements ICoreEvent {
  /**
   * Construct a new core event.
   */
  constructor(type: string) {
    this._m_type = type;
  }

  /**
   * The type of the event.
   */
  get type(): string {
    return this._m_type;
  }

  private _m_type: string;
}

} // module phosphor.core
