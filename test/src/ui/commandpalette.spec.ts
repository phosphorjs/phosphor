/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  commands
} from '../../../lib/ui/commands';

import {
  CommandItem, CommandPalette
} from '../../../lib/ui/commandpalette';


describe('ui/commandpalette', () => {

  describe('CommandItem', () => {

    describe('#constructor()', () => {

      it('should accept a command item options argument', () => {
        let command = commands.addCommand('test', { execute: () => { } });
        let options = { command: 'test', category: 'test' };
        let item = new CommandItem(options as CommandItem.IOptions);
        command.dispose();
      });

    });

  });

  describe('CommandPalette', () => { });

});
