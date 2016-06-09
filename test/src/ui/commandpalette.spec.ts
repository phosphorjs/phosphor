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

import {
  keymap, KeyBinding
} from '../../../lib/ui/keymap';


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
        expect(() => { item.command = 'test-1' }).to.throwError();
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
        expect(item.label).to.be(options.label);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.label = 'test label' }).to.throwError();
        command.dispose();
      });

    });

    describe('#caption', () => {

      it('should return the caption of a command item', () => {
        let options: ICommand = { execute: () => { }, caption: 'test caption' };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(item.caption).to.be(options.caption);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.caption = 'test caption' }).to.throwError();
        command.dispose();
      });

    });

    describe('#className', () => {

      it('should return the class name of a command item', () => {
        let options: ICommand = { execute: () => { }, className: 'testClass' };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(item.className).to.be(options.className);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.className = 'testClass' }).to.throwError();
        command.dispose();
      });

    });

    describe('#isEnabled', () => {

      it('should return whether a command item is enabled', () => {
        let called = false;
        let options: ICommand = {
          execute: () => { },
          isEnabled: () => called = !called
        };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(called).to.be(false);
        expect(item.isEnabled).to.be(true);
        expect(called).to.be(true);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.isEnabled = false }).to.throwError();
        command.dispose();
      });

    });

    describe('#isToggled', () => {

      it('should return whether a command item is toggled', () => {
        let called = false;
        let options: ICommand = {
          execute: () => { },
          isToggled: () => called = !called
        };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(called).to.be(false);
        expect(item.isToggled).to.be(true);
        expect(called).to.be(true);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.isToggled = false }).to.throwError();
        command.dispose();
      });

    });

    describe('#isVisible', () => {

      it('should return whether a command item is visible', () => {
        let called = false;
        let options: ICommand = {
          execute: () => { },
          isVisible: () => called = !called
        };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(called).to.be(false);
        expect(item.isVisible).to.be(true);
        expect(called).to.be(true);
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.isVisible = false }).to.throwError();
        command.dispose();
      });

    });

    describe('#keyBinding', () => {

      it('should return the key binding of a command item', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let binding = keymap.addBinding({
          keys: ['Ctrl A'],
          selector: 'body',
          command: 'test'
        });
        let item = new CommandItem({ command: 'test' });
        expect(item.keyBinding).to.be.a(KeyBinding);
        expect(item.keyBinding.keys).to.eql(['Ctrl A']);
        binding.dispose();
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.keyBinding = null }).to.throwError();
        command.dispose();
      });

    });

    describe('#category', () => {

      it('should return the category of a command item', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test', category: 'random' });
        expect(item.category).to.be('random');
        command.dispose();
      });

      it('should default the category to `"general"`', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(item.category).to.be('general');
        command.dispose();
      });

      it('should be read-only', () => {
        let options: ICommand = { execute: () => { } };
        let command = commands.addCommand('test', options);
        let item = new CommandItem({ command: 'test' });
        expect(() => { item.category = 'random' }).to.throwError();
        command.dispose();
      });

    });

  });

  describe('CommandPalette', () => {

    describe('.createNode()', () => {

      it('should create node for a command palette', () => {
        let node = CommandPalette.createNode();
        expect(!!node.querySelector('.p-CommandPalette-search')).to.be(true);
        expect(!!node.querySelector('.p-CommandPalette-input')).to.be(true);
        expect(!!node.querySelector('.p-CommandPalette-content')).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let palette = new CommandPalette();
        expect(palette).to.be.a(CommandPalette);
        expect(palette.node.classList.contains('p-CommandPalette')).to.be(true);
      });

      it('should accept command palette instantiation options', () => {
        let options: CommandPalette.IOptions = {};
        let palette = new CommandPalette(options);
        expect(palette).to.be.a(CommandPalette);
        expect(palette.node.classList.contains('p-CommandPalette')).to.be(true);
      });

    });

  });

});
