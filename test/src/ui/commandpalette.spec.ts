/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  CommandItem, CommandPalette
} from '../../../lib/ui/commandpalette';

import {
  commands, ICommand
} from '../../../lib/ui/commands';


describe('ui/commandpalette', () => {

  describe('CommandItem', () => {

    describe('#constructor()', () => {

      it('should accept a command item options argument', () => {
        let options: CommandItem.IOptions = { command: 'test' };
        let item = new CommandItem(options);
        expect(item).to.be.a(CommandItem);
      });

    });

    describe('#command', () => {

      it('should return the command name of a command item', () => {
        let options: CommandItem.IOptions = { command: 'test' };
        let item = new CommandItem(options);
        expect(item.command).to.be('test');
      });

      it('should be read-only', () => {
        let options: CommandItem.IOptions = { command: 'test' };
        let item = new CommandItem(options);
        expect(() => { item.command = null }).to.throwError();
      });

    });

    describe('#args', () => {

      it('should return the args of a command item', () => {
        let options: CommandItem.IOptions = {
          args: { foo: 'bar', baz: 'qux' } as JSONObject,
          command: 'test'
        };
        let item = new CommandItem(options);
        expect(item.args).to.eql(options.args);
      });

      it('should be read-only', () => {
        let options: CommandItem.IOptions = {
          args: { foo: 'bar', baz: 'qux' } as JSONObject,
          command: 'test'
        };
        let item = new CommandItem(options);
        expect(() => { item.args = null }).to.throwError();
      });

    });

    describe('#label', () => {

      it('should return the label of a command item', () => {
        let options: ICommand = { execute: () => { }, label: 'test label' };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(item.label).to.eql(options.label);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { }, label: 'test label' };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.label = null }).to.throwError();
        command.dispose();
      });

    });

  });

  describe('CommandPalette', () => { });

});
