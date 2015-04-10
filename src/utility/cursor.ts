/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * The class name added to the document body on cursor override.
 */
var CURSOR_CLASS = 'p-mod-cursor-override';


/**
 * The token object for the current override.
 */
var overrideToken: any = null;


/**
 * Override the cursor for the entire document.
 *
 * Returns an IDisposable which will clear the override.
 */
export
function overrideCursor(cursor: string): IDisposable {
  var token = overrideToken = <any>{};
  var body = document.body;
  body.style.cursor = cursor;
  body.classList.add(CURSOR_CLASS);
  return new Disposable(() => {
    if (token === overrideToken) {
      overrideToken = null;
      body.style.cursor = '';
      body.classList.remove(CURSOR_CLASS);
    }
  });
}

} // module phosphor.utility
