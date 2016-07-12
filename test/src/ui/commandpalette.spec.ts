/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  simulate
} from 'simulate-event';

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  sendMessage
} from '../../../lib/core/messaging';

import {
  CommandPalette
} from '../../../lib/ui/commandpalette';

import {
  CommandRegistry, ICommand
} from '../../../lib/ui/commands';

import {
  KeyBinding, KeymapManager
} from '../../../lib/ui/keymap';

import {
  Widget, WidgetMessage
} from '../../../lib/ui/widget';


class LogPalette extends CommandPalette {

  events: string[] = [];

  dispose(): void {
    super.dispose();
    this.events.length = 0;
  }

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}


describe('ui/commandpalette', () => {

  let commands: CommandRegistry;
  let keymap: KeymapManager;

  beforeEach(() => {
    commands = new CommandRegistry();
    keymap = new KeymapManager();
  });

  describe('CommandPalette', () => {

    describe('#constructor()', () => {

      it('should accept command palette instantiation options', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(palette).to.be.a(CommandPalette);
        expect(palette.node.classList.contains('p-CommandPalette')).to.be(true);
        palette.dispose();
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the command palette', () => {
        commands.addCommand('test', { execute: () => { } });
        let palette = new CommandPalette({ commands, keymap });
        palette.addItem({ command: 'test' });
        palette.dispose();
        expect(palette.isDisposed).to.be(true);
      });

    });

    describe('#searchNode', () => {

      it('should return the search node of a command palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        let node = palette.searchNode;
        expect(node).to.be.ok();
        expect(node.classList.contains('p-CommandPalette-search')).to.be(true);
        palette.dispose();
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.searchNode = null; }).to.throwError();
        palette.dispose();
      });

    });

    describe('#inputNode', () => {

      it('should return the input node of a command palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        let node = palette.inputNode;
        expect(node).to.be.ok();
        expect(node.classList.contains('p-CommandPalette-input')).to.be(true);
        palette.dispose();
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.inputNode = null; }).to.throwError();
        palette.dispose();
      });

    });

    describe('#contentNode', () => {

      it('should return the content node of a command palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        let node = palette.contentNode;
        expect(node).to.be.ok();
        expect(node.classList.contains('p-CommandPalette-content')).to.be(true);
        palette.dispose();
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.contentNode = null; }).to.throwError();
        palette.dispose();
      });

    });

    describe('#items', () => {

      it('should return the items in a command palette', () => {
        commands.addCommand('test', { execute: () => { } });
        let palette = new CommandPalette({ commands, keymap });
        expect(palette.items.length).to.be(0);
        palette.addItem({ command: 'test' });
        expect(palette.items.length).to.be(1);
        expect(palette.items.at(0).command).to.be('test');
        palette.dispose();
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.items = null; }).to.throwError();
        palette.dispose();
      });

    });

    describe('#commands', () => {

      it('should get the command registry for the command palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(palette.commands).to.be(commands);
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.commands = null; }).to.throwError();
      });

    });

    describe('#keymap', () => {

      it('should get the keymap manager for the command palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(palette.keymap).to.be(keymap);
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.keymap = null; }).to.throwError();
      });

    });

    describe('#renderer', () => {

      it('should get the renderer for the command palette', () => {
        let renderer = Object.create(CommandPalette.defaultRenderer);
        let palette = new CommandPalette({ commands, keymap, renderer });
        expect(palette.renderer).to.be(renderer);
      });

      it('should be read-only', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(() => { palette.renderer = null; }).to.throwError();
      });

    });

    describe('#addItem()', () => {

      it('should add an item to a command palette using options', () => {
        let palette = new CommandPalette({ commands, keymap });
        expect(palette.items.length).to.be(0);
        expect(palette.addItem({ command: 'test' }).command).to.be('test');
        expect(palette.items).to.have.length(1);
        expect(palette.items.at(0).command).to.be('test');
        palette.dispose();
      });

      it('should add the shortcut for an item to a command palette', () => {
        commands.addCommand('test', { execute: () => { } });
        keymap.addBinding({
          keys: ['Ctrl A'],
          selector: 'body',
          command: 'test'
        });

        let palette = new CommandPalette({ commands, keymap });
        let content = palette.contentNode;

        Widget.attach(palette, document.body);
        expect(palette.items.length).to.be(0);
        expect(palette.addItem({ command: 'test' }).command).to.be('test');
        sendMessage(palette, WidgetMessage.UpdateRequest);

        let node = palette.contentNode.querySelector('.p-CommandPalette-item');
        let shortcut = node.querySelector('.p-CommandPalette-itemShortcut');

        expect(node).to.be.ok();
        expect(shortcut).to.be.ok();
        expect(shortcut.textContent.length).to.be.greaterThan(0);
        expect(palette.items.length).to.be(1);
        expect(palette.items.at(0).command).to.be('test');

        palette.dispose();
      });

    });

    describe('#removeItem()', () => {

      it('should remove an item from a command palette by item', () => {
        commands.addCommand('test', { execute: () => { } });
        let palette = new CommandPalette({ commands, keymap });
        Widget.attach(palette, document.body);
        expect(palette.items).to.be.empty();
        let item = palette.addItem({ command: 'test' });
        expect(palette.items).to.have.length(1);
        palette.removeItem(item);
        expect(palette.items).to.be.empty();
        palette.dispose();
      });

      it('should remove an item from a command palette by index', () => {
        commands.addCommand('test', { execute: () => { } });
        let palette = new CommandPalette({ commands, keymap });
        Widget.attach(palette, document.body);
        expect(palette.items).to.be.empty();
        palette.addItem({ command: 'test' });
        expect(palette.items).to.have.length(1);
        palette.removeItem(0);
        expect(palette.items).to.be.empty();
        palette.dispose();
      });

      it('should do nothing if the item is not contained in a palette', () => {
        let palette = new CommandPalette({ commands, keymap });
        Widget.attach(palette, document.body);
        expect(palette.items).to.be.empty();
        palette.removeItem(0);
        expect(palette.items).to.be.empty();
        palette.dispose();
      });

    });

    describe('#clearItems()', () => {

      it('should remove all items from a command palette', () => {
        commands.addCommand('test', { execute: () => { } });
        let palette = new CommandPalette({ commands, keymap });
        Widget.attach(palette, document.body);
        expect(palette.items).to.be.empty();
        palette.addItem({ command: 'test', category: 'one' });
        palette.addItem({ command: 'test', category: 'two' });
        expect(palette.items).to.have.length(2);
        palette.clearItems();
        expect(palette.items).to.be.empty();
        palette.dispose();
      });

    });

    describe('#handleEvent()', () => {

      it('should handle click, keydown, and input events', () => {
        let palette = new LogPalette({ commands, keymap });
        Widget.attach(palette, document.body);
        ['click', 'keydown', 'input'].forEach(type => {
          simulate(palette.node, type);
          expect(palette.events).to.contain(type);
        });
        palette.dispose();
      });

      context('click', () => {

        it('should trigger a command when its item is clicked', () => {
          let called = false;
          commands.addCommand('test', { execute: () => called = true });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let node = content.querySelector('.p-CommandPalette-item');

          expect(node).to.be.ok();
          simulate(node, 'click');
          expect(called).to.be(true);

          palette.dispose();
        });

        it('should ignore if it is not a left click', () => {
          let called = false;
          commands.addCommand('test', { execute: () => called = true });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let node = content.querySelector('.p-CommandPalette-item');

          expect(node).to.be.ok();
          simulate(node, 'click', { button: 1 });
          expect(called).to.be(false);

          palette.dispose();
        });

      });

      context('keydown', () => {

        it('should navigate down if down arrow is pressed', () => {
          commands.addCommand('test', { execute: () => { } });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let node = content.querySelector('.p-mod-active');

          expect(node).to.not.be.ok();
          simulate(palette.node, 'keydown', { keyCode: 40 }); // Down arrow
          simulate(palette.node, 'keydown', { keyCode: 40 }); // Down arrow
          node = content.querySelector('.p-CommandPalette-item.p-mod-active');
          expect(node).to.be.ok();

          palette.dispose();
        });

        it('should navigate up if up arrow is pressed', () => {
          commands.addCommand('test', { execute: () => { } });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let node = content.querySelector('.p-mod-active');

          expect(node).to.not.be.ok();
          simulate(palette.node, 'keydown', { keyCode: 38 }); // Up arrow
          node = content.querySelector('.p-CommandPalette-item.p-mod-active');
          expect(node).to.be.ok();

          palette.dispose();
        });

        it('should ignore if modifier keys are pressed', () => {
          let called = false;
          commands.addCommand('test', { execute: () => called = true });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let node = content.querySelector('.p-mod-active');

          expect(node).to.not.be.ok();
          ['altKey', 'ctrlKey', 'shiftKey', 'metaKey'].forEach(key => {
            let options: any = { keyCode: 38 };
            options[key] = true;
            simulate(palette.node, 'keydown', options);
            node = content.querySelector('.p-CommandPalette-item.p-mod-active');
            expect(node).to.not.be.ok();
          });

          palette.dispose();
        });

        it('should trigger active item if enter is pressed', () => {
          let called = false;
          let command = commands.addCommand('test', { execute: () => called = true });
          let palette = new CommandPalette({ commands, keymap });
          let content = palette.contentNode;

          palette.addItem({ command: 'test' });
          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          expect(content.querySelector('.p-mod-active')).to.not.be.ok();
          simulate(palette.node, 'keydown', { keyCode: 40 }); // Down arrow
          simulate(palette.node, 'keydown', { keyCode: 40 }); // Down arrow
          simulate(palette.node, 'keydown', { keyCode: 13 }); // Enter
          expect(called).to.be(true);

          palette.dispose();
        });

        it('should trigger active category if enter is pressed', () => {
          let palette = new CommandPalette({ commands, keymap });
          let categories = ['A', 'B'];
          let names = [
            ['A', 'B', 'C', 'D', 'E'],
            ['F', 'G', 'H', 'I', 'J']
          ];
          names.forEach((values, index) => {
            values.forEach(command => {
              palette.addItem({ category: categories[index], command });
              commands.addCommand(command, { execute: () => { }, label: command });
            });
          });

          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let content = palette.contentNode;
          let items = () => content.querySelectorAll('.p-CommandPalette-item');

          expect(items()).to.have.length(10);
          expect(content.querySelector('.p-mod-active')).to.not.be.ok();
          simulate(palette.node, 'keydown', { keyCode: 40 }); // Down arrow
          simulate(palette.node, 'keydown', { keyCode: 13 }); // Enter
          sendMessage(palette, WidgetMessage.UpdateRequest);
          expect(items()).to.have.length(5);

          palette.dispose();
        });

      });

      context('input', () => {

        it('should filter the list of visible items', () => {
          let palette = new CommandPalette({ commands, keymap });
          ['A', 'B', 'C', 'D', 'E'].forEach(name => {
            commands.addCommand(name, { execute: () => { }, label: name });
            palette.addItem({ command: name });
          });

          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let content = palette.contentNode;
          let itemClass = '.p-CommandPalette-item';
          let items = () => content.querySelectorAll(itemClass);

          expect(items()).to.have.length(5);
          palette.inputNode.value = 'A';
          sendMessage(palette, WidgetMessage.UpdateRequest);
          expect(items()).to.have.length(1);

          palette.dispose();
        });

        it('should filter by both text and category', () => {
          let palette = new CommandPalette({ commands, keymap });
          let categories = ['Z', 'Y'];
          let names = [
            ['A1', 'B2', 'C3', 'D4', 'E5'],
            ['F1', 'G2', 'H3', 'I4', 'J5']
          ];
          names.forEach((values, index) => {
            values.forEach(command => {
              palette.addItem({ category: categories[index], command });
              commands.addCommand(command, { execute: () => { }, label: command });
            });
          });

          sendMessage(palette, WidgetMessage.UpdateRequest);
          Widget.attach(palette, document.body);

          let content = palette.contentNode;
          let catSelector = '.p-CommandPalette-header';
          let items = () => content.querySelectorAll('.p-CommandPalette-item');
          let input = (value: string) => {
            palette.inputNode.value = value;
            sendMessage(palette, WidgetMessage.UpdateRequest);
          };

          expect(items()).to.have.length(10);
          input(`${categories[1]}:`); // Category match
          expect(items()).to.have.length(5);
          input(`${categories[1]}: B`); // No match
          expect(items()).to.have.length(0);
          input(`${categories[1]}: I`); // Category and text match
          expect(items()).to.have.length(1);

          input('1'); // Multi-category match
          expect(palette.node.querySelectorAll(catSelector)).to.have.length(2);
          expect(items()).to.have.length(2);
          simulate(palette.node, 'keydown', { keyCode: 38 }); // Up arrow
          simulate(palette.node, 'keydown', { keyCode: 13 }); // Enter
          let cat = categories.sort().map(cat => cat.toLowerCase())[0];
          expect(palette.inputNode.value).to.be(`${cat}: 1`);

          palette.dispose();
        });

      });

    });

  });

});
