/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  expect
} from 'chai';

import {
  generate
} from 'simulate-event';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  JSONObject
} from '@phosphor/coreutils';

import {
  Platform
} from '@phosphor/domutils';


const NULL_COMMAND = {
  execute: (args: JSONObject | null) => { return args; }
};


describe('@phosphor/commands', () => {

  describe('CommandRegistry', () => {

    let registry: CommandRegistry = null!;

    beforeEach(() => {
      registry = new CommandRegistry();
    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        expect(registry).to.be.an.instanceof(CommandRegistry);
      });

    });

    describe('#commandChanged', () => {

      it('should be emitted when a command is added', () => {
        let called = false;
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.equal(registry);
          expect(args.id).to.equal('test');
          expect(args.type).to.equal('added');
          called = true;
        });
        registry.addCommand('test', NULL_COMMAND);
        expect(called).to.equal(true);
      });

      it('should be emitted when a command is changed', () => {
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.equal(registry);
          expect(args.id).to.equal('test');
          expect(args.type).to.equal('changed');
          called = true;
        });
        registry.notifyCommandChanged('test');
        expect(called).to.equal(true);
      });

      it('should be emitted when a command is removed', () => {
        let called = false;
        let disposable = registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.equal(registry);
          expect(args.id).to.equal('test');
          expect(args.type).to.equal('removed');
          called = true;
        });
        disposable.dispose();
        expect(called).to.equal(true);
      });

    });

    describe('#commandExecuted', () => {

      it('should be emitted when a command is executed', () => {
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandExecuted.connect((reg, args) => {
          expect(reg).to.equal(registry);
          expect(args.id).to.equal('test');
          expect(args.args).to.equal(null);
          called = true;
        });
        registry.execute('test', null);
        expect(called).to.equal(true);
      });

    });

    describe('#keyBindings', () => {

      it('should be the keybindings in the palette', () => {
        registry.addCommand('test', { execute: () => { } });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `body`,
          command: 'test'
        });
        expect(registry.keyBindings.length).to.equal(1);
        expect(registry.keyBindings[0].command).to.equal('test');
      });

    });

    describe('#listCommands()', () => {

      it('should list the ids of the registered commands', () => {
        registry.addCommand('test0', NULL_COMMAND);
        registry.addCommand('test1', NULL_COMMAND);
        expect(registry.listCommands()).to.deep.equal(['test0', 'test1']);
      });

      it('should be a new array', () => {
        registry.addCommand('test0', NULL_COMMAND);
        registry.addCommand('test1', NULL_COMMAND);
        let cmds = registry.listCommands();
        cmds.push('test2');
        expect(registry.listCommands()).to.deep.equal(['test0', 'test1']);
      });

    });

    describe('#hasCommand()', () => {

      it('should test whether a specific command is registerd', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.hasCommand('test')).to.equal(true);
        expect(registry.hasCommand('foo')).to.equal(false);
      });

    });

    describe('#addCommand()', () => {

      it('should add a command to the registry', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.hasCommand('test')).to.equal(true);
      });

      it('should return a disposable which will unregister the command', () => {
        let disposable = registry.addCommand('test', NULL_COMMAND);
        disposable.dispose();
        expect(registry.hasCommand('test')).to.equal(false);
      });

      it('should throw an error if the given `id` is already registered', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(() => {
          registry.addCommand('test', NULL_COMMAND);
        }).to.throw(Error);
      });

      it('should clone the `cmd` before adding it to the registry', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          label: 'foo'
        };
        registry.addCommand('test', cmd);
        cmd.label = 'bar';
        expect(registry.label('test', null)).to.equal('foo');
      });

    });

    describe('#notifyCommandChanged()', () => {

      it('should emit the `commandChanged` signal for the command', () => {
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.equal(registry);
          expect(args.id).to.equal('test');
          expect(args.type).to.equal('changed');
          called = true;
        });
        registry.notifyCommandChanged('test');
        expect(called).to.equal(true);
      });

      it('should throw an error if the command is not registered', () => {
        expect(() => {
          registry.notifyCommandChanged('foo');
        }).to.throw(Error);
      });

    });

    describe('#label()', () => {

      it('should get the display label for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          label: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.label('test', null)).to.equal('foo');
      });

      it('should give the appropriate label given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          label: (args: JSONObject | null) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.label('test', null)).to.equal('null');
      });

      it('should return an empty string if the command is not registered', () => {
        expect(registry.label('foo', null)).to.equal('');
      });

      it('should default to an empty string for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.label('test', null)).to.equal('');
      });

    });

    describe('#mnemonic()', () => {

      it('should get the mnemonic index for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          mnemonic: 1
        };
        registry.addCommand('test', cmd);
        expect(registry.mnemonic('test', null)).to.equal(1);
      });

      it('should give the appropriate mnemonic given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          mnemonic: (args: JSONObject | null) => { return JSON.stringify(args).length; }
        };
        registry.addCommand('test', cmd);
        expect(registry.mnemonic('test', null)).to.equal(4);
      });

      it('should return a `-1` if the command is not registered', () => {
        expect(registry.mnemonic('foo', null)).to.equal(-1);
      });

      it('should default to `-1` for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.mnemonic('test', null)).to.equal(-1);
      });

    });

    describe('#icon()', () => {

      it('should get the icon for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          icon: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.icon('test', null)).to.equal('foo');
      });

      it('should give the appropriate icon given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          icon: (args: JSONObject | null) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.icon('test', null)).to.equal('null');
      });

      it('should return an empty string if the command is not registered', () => {
        expect(registry.icon('foo', null)).to.equal('');
      });

      it('should default to an empty string for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.icon('test', null)).to.equal('');
      });

    });

    describe('#caption()', () => {

      it('should get the caption for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          caption: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.caption('test', null)).to.equal('foo');
      });

      it('should give the appropriate caption given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          caption: (args: JSONObject | null) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.caption('test', null)).to.equal('null');
      });

      it('should return an empty string if the command is not registered', () => {
        expect(registry.caption('foo', null)).to.equal('');
      });

      it('should default to an empty string for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.caption('test', null)).to.equal('');
      });

    });

    describe('#usage()', () => {

      it('should get the usage text for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          usage: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.usage('test', null)).to.equal('foo');
      });

      it('should give the appropriate usage text given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          usage: (args: JSONObject | null) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.usage('test', null)).to.equal('null');
      });

      it('should return an empty string if the command is not registered', () => {
        expect(registry.usage('foo', null)).to.equal('');
      });

      it('should default to an empty string for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.usage('test', null)).to.equal('');
      });

    });

    describe('#className()', () => {

      it('should get the extra class name for a specific command', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          className: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.className('test', null)).to.equal('foo');
      });

      it('should give the appropriate class name given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          className: (args: JSONObject | null) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.className('test', null)).to.equal('null');
      });

      it('should return an empty string if the command is not registered', () => {
        expect(registry.className('foo', null)).to.equal('');
      });

      it('should default to an empty string for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.className('test', null)).to.equal('');
      });

    });

    describe('#isEnabled()', () => {

      it('should test whether a specific command is enabled', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isEnabled: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isEnabled('test', null)).to.equal(true);
      });

      it('should give the appropriate value given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isEnabled: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isEnabled('test', {})).to.equal(false);
      });

      it('should return `false` if the command is not registered', () => {
        expect(registry.isEnabled('foo', null)).to.equal(false);
      });

      it('should default to `true` for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isEnabled('test', null)).to.equal(true);
      });

    });

    describe('#isToggled()', () => {

      it('should test whether a specific command is toggled', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isToggled: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isToggled('test', null)).to.equal(true);
      });

      it('should give the appropriate value given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isToggled: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isToggled('test', {})).to.equal(false);
      });

      it('should return `false` if the command is not registered', () => {
        expect(registry.isToggled('foo', null)).to.equal(false);
      });

      it('should default to `false` for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isToggled('test', null)).to.equal(false);
      });

    });

    describe('#isVisible()', () => {

      it('should test whether a specific command is visible', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isVisible: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isVisible('test', null)).to.equal(true);
      });

      it('should give the appropriate value given arguments', () => {
        let cmd = {
          execute: (args: JSONObject | null) => { return args; },
          isVisible: (args: JSONObject | null) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isVisible('test', {})).to.equal(false);
      });

      it('should return `false` if the command is not registered', () => {
        expect(registry.isVisible('foo', null)).to.equal(false);
      });

      it('should default to `true` for a command', () => {
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isVisible('test', null)).to.equal(true);
      });

    });

    describe('#execute()', () => {

      it('should execute a specific command', () => {
        let called = false;
        let cmd = {
          execute: (args: JSONObject | null) => { called = true; },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null);
        expect(called).to.equal(true);
      });

      it('should resolve with the result of the command', (done) => {
        let cmd = {
          execute: (args: JSONObject | null) => { return Promise.resolve(null); },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null).then(result => {
          expect(result).to.equal(null);
          done();
        });
      });

      it('should reject if the command throws an error', (done) => {
        let cmd = {
          execute: (args: JSONObject | null) => { throw new Error(''); },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null).catch(() => {
          done();
        });
      });

      it('should reject if the command is not registered', (done) => {
        registry.execute('foo', null).catch(() => {
          done();
        });
      });

    });

    let elemID = 0;
    let elem: HTMLElement = null!;

    beforeEach(() => {
      elem = document.createElement('div') as HTMLElement;
      elem.id = `test${elemID++}`;
      elem.addEventListener('keydown', event => {
        registry.processKeydownEvent(event);
      });
      document.body.appendChild(elem);
    });

    afterEach(() => {
      document.body.removeChild(elem);
    });

    describe('#findKeyBinding()', () => {

      it('should find a key binding based on command and args', () => {
        let a1: JSONObject | null = { 'foo': 'bar' };
        let a2: JSONObject | null = { 'bar': 'baz' };
        let a3: JSONObject | null = { 'baz': 'qux' };
        let a4: JSONObject | null = null;
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: '.b1',
          command: 'c1',
          args: a1
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: '.b2',
          command: 'c1',
          args: a2
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: '.b3',
          command: 'c1',
          args: a3
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: '.b4',
          command: 'c2',
          args: a4
        });
        expect(registry.findKeyBinding('c1', a1)!.selector).to.equal('.b1');
        expect(registry.findKeyBinding('c1', a2)!.selector).to.equal('.b2');
        expect(registry.findKeyBinding('c1', a3)!.selector).to.equal('.b3');
        expect(registry.findKeyBinding('c2', a4)!.selector).to.equal('.b4');
      });

    });

    describe('#addKeyBinding()', () => {

      it('should add key bindings to the registry', () => {
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });
        elem.dispatchEvent(event);
        expect(called).to.equal(true);
      });

      it('should remove a binding when disposed', () => {
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        binding.dispose();
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });
        elem.dispatchEvent(event);
        expect(called).to.equal(false);
      });

      it('should emit a key binding changed signal when added and removed', () => {
        let added = false;
        registry.addCommand('test', { execute: () => { } });
        registry.keyBindingChanged.connect((sender, args) => {
          added = args.type === 'added';
        });
        let binding = registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        expect(added).to.equal(true);
        binding.dispose();
        expect(added).to.equal(false);
      });

      it('should throw an error if binding has an invalid selector', () => {
        let options = { keys: ['Ctrl ;'], selector: '..', command: 'test' };
        expect(() => { registry.addKeyBinding(options); }).to.throw(Error);
      });

    });

    describe('#processKeydownEvent()', () => {

      it('should dispatch on a correct keyboard event', () => {
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });
        elem.dispatchEvent(event);
        expect(called).to.equal(true);
      });

      it('should not dispatch on a non-matching keyboard event', () => {
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 45, ctrlKey: true });
        elem.dispatchEvent(event);
        expect(called).to.equal(false);
      });

      it('should not dispatch with non-matching modifiers', () => {
        let count = 0;
        registry.addCommand('test', {
          execute: () => { count++; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl S'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let eventAlt = generate('keydown', { keyCode: 83, altKey: true });
        let eventShift = generate('keydown', { keyCode: 83, shiftKey: true });
        elem.dispatchEvent(eventAlt);
        expect(count).to.equal(0);
        elem.dispatchEvent(eventShift);
        expect(count).to.equal(0);
      });

      it('should dispatch with multiple chords in a key sequence', () => {
        let count = 0;
        registry.addCommand('test', {
          execute: () => { count++; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl K', 'Ctrl L'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let eventK = generate('keydown', { keyCode: 75, ctrlKey: true });
        let eventL = generate('keydown', { keyCode: 76, ctrlKey: true });
        elem.dispatchEvent(eventK);
        expect(count).to.equal(0);
        elem.dispatchEvent(eventL);
        expect(count).to.equal(1);
        elem.dispatchEvent(generate('keydown', eventL)); // Don't reuse; clone.
        expect(count).to.equal(1);
        elem.dispatchEvent(generate('keydown', eventK)); // Don't reuse; clone.
        expect(count).to.equal(1);
        elem.dispatchEvent(generate('keydown', eventL)); // Don't reuse; clone.
        expect(count).to.equal(2);
      });

      it('should not execute handler without matching selector', () => {
        let count = 0;
        registry.addCommand('test', {
          execute: () => { count++; }
        });
        registry.addKeyBinding({
          keys: ['Shift P'],
          selector: '.inaccessible-scope',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 80, shiftKey: true });
        expect(count).to.equal(0);
        elem.dispatchEvent(event);
        expect(count).to.equal(0);
      });

      it('should not execute a handler when missing a modifier', () => {
        let count = 0;
        registry.addCommand('test', {
          execute: () => { count++; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl P'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 17 });
        expect(count).to.equal(0);
        elem.dispatchEvent(event);
        expect(count).to.equal(0);
      });

      it('should register partial and exact matches', () => {
        let count1 = 0;
        let count2 = 0;
        registry.addCommand('test1', {
          execute: () => { count1++; }
        });
        registry.addCommand('test2', {
          execute: () => { count2++; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl S'],
          selector: `#${elem.id}`,
          command: 'test1'
        });
        registry.addKeyBinding({
          keys: ['Ctrl S', 'Ctrl D'],
          selector: `#${elem.id}`,
          command: 'test2'
        });
        let event1 = generate('keydown', { keyCode: 83, ctrlKey: true });
        let event2 = generate('keydown', { keyCode: 68, ctrlKey: true });
        expect(count1).to.equal(0);
        expect(count2).to.equal(0);
        elem.dispatchEvent(event1);
        expect(count1).to.equal(0);
        expect(count2).to.equal(0);
        elem.dispatchEvent(event2);
        expect(count1).to.equal(0);
        expect(count2).to.equal(1);
      });

      it('should recognize permutations of modifiers', () => {
        let count1 = 0;
        let count2 = 0;
        registry.addCommand('test1', {
          execute: () => { count1++; }
        });
        registry.addCommand('test2', {
          execute: () => { count2++; }
        });
        registry.addKeyBinding({
          keys: ['Shift Alt Ctrl T'],
          selector: `#${elem.id}`,
          command: 'test1'
        });
        registry.addKeyBinding({
          keys: ['Alt Shift Ctrl Q'],
          selector: `#${elem.id}`,
          command: 'test2'
        });
        let event1 = generate('keydown', {
          keyCode: 84,
          ctrlKey: true,
          altKey: true,
          shiftKey: true
        });
        let event2 = generate('keydown', {
          keyCode: 81,
          ctrlKey: true,
          altKey: true,
          shiftKey: true
        });
        expect(count1).to.equal(0);
        elem.dispatchEvent(event1);
        expect(count1).to.equal(1);
        expect(count2).to.equal(0);
        elem.dispatchEvent(event2);
        expect(count2).to.equal(1);
      });

      it('should play back a partial match that was not completed', () => {
        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => { codes.push(event.keyCode); };
        document.body.addEventListener('keydown', keydown);
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['D', 'D'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event1 = generate('keydown', { keyCode: 68 });
        let event2 = generate('keydown', { keyCode: 69 });
        elem.dispatchEvent(event1);
        expect(codes.length).to.equal(0);
        elem.dispatchEvent(event2);
        expect(called).to.equal(false);
        expect(codes).to.deep.equal([68, 69]);
        document.body.removeEventListener('keydown', keydown);
      });

      it('should play back a partial match that times out', (done) => {
        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => { codes.push(event.keyCode); };
        document.body.addEventListener('keydown', keydown);
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['D', 'D'],
          selector: `#${elem.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });
        elem.dispatchEvent(event);
        expect(codes.length).to.equal(0);
        setTimeout(() => {
          expect(codes).to.deep.equal([68]);
          expect(called).to.equal(false);
          document.body.removeEventListener('keydown', keydown);
          done();
        }, 1300);
      });

      it('should resolve an exact match of partial match time out', (done) => {
        let called1 = false;
        let called2 = false;
        registry.addCommand('test1', {
          execute: () => { called1 = true; }
        });
        registry.addCommand('test2', {
          execute: () => { called2 = true; }
        });
        registry.addKeyBinding({
          keys: ['D', 'D'],
          selector: `#${elem.id}`,
          command: 'test1'
        });
        registry.addKeyBinding({
          keys: ['D'],
          selector: `#${elem.id}`,
          command: 'test2'
        });
        let event = generate('keydown', { keyCode: 68 });
        elem.dispatchEvent(event);
        expect(called1).to.equal(false);
        expect(called2).to.equal(false);
        setTimeout(() => {
          expect(called1).to.equal(false);
          expect(called2).to.equal(true);
          done();
        }, 1300);
      });

      it('should pick the selector with greater specificity', () => {
        elem.classList.add('test');
        let called1 = false;
        let called2 = false;
        registry.addCommand('test1', {
          execute: () => { called1 = true; }
        });
        registry.addCommand('test2', {
          execute: () => { called2 = true; }
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: '.test',
          command: 'test1'
        });
        registry.addKeyBinding({
          keys: ['Ctrl ;'],
          selector: `#${elem.id}`,
          command: 'test2'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });
        elem.dispatchEvent(event);
        expect(called1).to.equal(false);
        expect(called2).to.equal(true);
      });

      it('should propagate if partial binding selector does not match', () => {
        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => {
          codes.push(event.keyCode);
        };
        document.body.addEventListener('keydown', keydown);
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['D', 'D'],
          selector: '#baz',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });
        elem.dispatchEvent(event);
        expect(codes).to.deep.equal([68]);
        expect(called).to.equal(false);
        document.body.removeEventListener('keydown', keydown);
      });

      it('should propagate if exact binding selector does not match', () => {
        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => {
          codes.push(event.keyCode);
        };
        document.body.addEventListener('keydown', keydown);
        let called = false;
        registry.addCommand('test', {
          execute: () => { called = true; }
        });
        registry.addKeyBinding({
          keys: ['D'],
          selector: '#baz',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });
        elem.dispatchEvent(event);
        expect(codes).to.deep.equal([68]);
        expect(called).to.equal(false);
        document.body.removeEventListener('keydown', keydown);
      });

    });

    describe('.parseKeystroke()', () => {

      it('should parse a keystroke into its parts', () => {
        let parts = CommandRegistry.parseKeystroke('Ctrl Shift Alt S');
        expect(parts.cmd).to.equal(false);
        expect(parts.ctrl).to.equal(true);
        expect(parts.alt).to.equal(true);
        expect(parts.shift).to.equal(true);
        expect(parts.key).to.equal('S');
      });

      it('should be a tolerant parse', () => {
        let parts = CommandRegistry.parseKeystroke('G Ctrl Shift S Shift K');
        expect(parts.cmd).to.equal(false);
        expect(parts.ctrl).to.equal(true);
        expect(parts.alt).to.equal(false);
        expect(parts.shift).to.equal(true);
        expect(parts.key).to.equal('K');
      });

    });

    describe('.normalizeKeystroke()', () => {

      it('should normalize and validate a keystroke', () => {
        let stroke = CommandRegistry.normalizeKeystroke('Ctrl S');
        expect(stroke).to.equal('Ctrl S');
      });

      it('should handle multiple modifiers', () => {
        let stroke = CommandRegistry.normalizeKeystroke('Ctrl Shift Alt S');
        expect(stroke).to.equal('Ctrl Alt Shift S');
      });

      it('should handle platform specific modifiers', () => {
        let stroke = '';
        if (Platform.IS_MAC) {
          stroke = CommandRegistry.normalizeKeystroke('Cmd S');
          expect(stroke).to.equal('Cmd S');
          stroke = CommandRegistry.normalizeKeystroke('Accel S');
          expect(stroke).to.equal('Cmd S');
        } else {
          stroke = CommandRegistry.normalizeKeystroke('Cmd S');
          expect(stroke).to.equal('S');
          stroke = CommandRegistry.normalizeKeystroke('Accel S');
          expect(stroke).to.equal('Ctrl S');
        }
      });

    });

    describe('.keystrokeForKeydownEvent()', () => {

      it('should create a normalized keystroke', () => {
        let event = generate('keydown', { ctrlKey: true, keyCode: 83 });
        let keystroke = CommandRegistry.keystrokeForKeydownEvent(event as KeyboardEvent);
        expect(keystroke).to.equal('Ctrl S');
      });

      it('should handle multiple modifiers', () => {
        let event = generate('keydown', {
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
          keyCode: 83
        });
        let keystroke = CommandRegistry.keystrokeForKeydownEvent(event as KeyboardEvent);
        expect(keystroke).to.equal('Ctrl Alt Shift S');
      });

      it('should fail on an invalid shortcut', () => {
        let event = generate('keydown', { keyCode: -1 });
        let keystroke = CommandRegistry.keystrokeForKeydownEvent(event as KeyboardEvent);
        expect(keystroke).to.equal('');
      });

    });

  });

});
