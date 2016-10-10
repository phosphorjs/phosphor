/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

import {
  generate
} from 'simulate-event';

import {
  JSONObject
} from '../../../lib/algorithm/json';

import {
  IS_MAC
} from '../../../lib/dom/platform';

import {
  CommandRegistry
} from '../../../lib/ui/commandregistry';

import {
  Keymap
} from '../../../lib/ui/keymap';

import {
  EN_US, KeycodeLayout
} from '../../../lib/ui/keyboard';


/**
 * A monotonically increasing id number.
 */
let elemID = 0;


/**
 * Create an element with a unique id and add to the document.
 */
function createElement(): HTMLElement {
  let el = document.createElement('div') as HTMLElement;
  el.id = `test${elemID++}`;
  document.body.appendChild(el);
  return el;
}


describe('ui/keymap', () => {

  describe('Keymap.IBinding', () => {

    let commands: CommandRegistry;
    let keymap: Keymap;

    beforeEach(() => {
      commands = new CommandRegistry();
      keymap = new Keymap({ commands });
    });

    describe('#keys', () => {

      it('should be set from instantiation options', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(binding.keys).to.eql(['Ctrl A']);
      });

      it('should be read only', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(() => { binding.keys = null!; }).to.throwError();
      });

    });

    describe('#selector', () => {

      it('should be set from instantiation options', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(binding.selector).to.be('body');
      });

      it('should be read only', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(() => { binding.selector = null!; }).to.throwError();
      });

    });

    describe('#command', () => {

      it('should be set from instantiation options', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(binding.command).to.be('test');
      });

      it('should be read only', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(() => { binding.command = null!; }).to.throwError();
      });

    });

    describe('#args', () => {

      it('should be set from instantiation options', () => {
        let options = {
          keys: ['Ctrl A'],
          selector: 'body',
          command: 'test',
          args: { foo: 'bar', baz: 'qux' } as JSONObject
        };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', options.args)!;
        expect(binding.args).to.eql(options.args);
      });

      it('should be read only', () => {
        let options = { keys: ['Ctrl A'], selector: 'body', command: 'test' };
        keymap.addBinding(options);
        let binding = keymap.findBinding('test', null)!;
        expect(() => { binding.args = null; }).to.throwError();
      });

    });

  });

  describe('Keymap', () => {

    let commands: CommandRegistry;
    let keymap: Keymap;

    beforeEach(() => {
      commands = new CommandRegistry();
      keymap = new Keymap({ commands });
    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let keymap = new Keymap({ commands });
        expect(keymap).to.be.a(Keymap);
      });

      it('should accept an options object', () => {
        let commands = new CommandRegistry();
        let keymap = new Keymap({ commands });
        expect(keymap.commands).to.be(commands);
      });

    });

    describe('#layout', () => {

      it('should be a keycode layout', () => {
        expect(keymap.layout).to.be.a(KeycodeLayout);
      });

      it('should default to `EN_US` layout', () => {
        expect(keymap.layout).to.be(EN_US);
      });

      it('should emit a layout changed signal', () => {
        let called = 0;
        let handler = () => { called++; };
        keymap.layoutChanged.connect(handler);
        keymap.layout = new KeycodeLayout('ab-cd', {});
        expect(called).to.be(1);
        keymap.layout = null;
        expect(called).to.be(2);
        keymap.layoutChanged.disconnect(handler);
      });

      it('should reset to `EN_US` if set to `null`', () => {
        keymap.layout = null;
        expect(keymap.layout).to.be(EN_US);
      });

    });

    describe('#commands', () => {

      it('should be the command registry used by the keymap', () => {
        let commands = new CommandRegistry();
        let keymap = new Keymap({ commands });
        expect(keymap.commands).to.be(commands);
      });

    });

    describe('#bindings', () => {

      it('should return the bindings as a sequence', () => {
        let command = commands.addCommand('test', { execute: () => { } });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `body`,
          command: 'test'
        });
        expect(keymap.bindings.length).to.be(1);
        expect(keymap.bindings.at(0).command).to.be('test');
        binding.dispose();
        command.dispose();
      });

    });

    describe('#addBinding()', () => {

      it('should add key bindings to the keymap manager', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });
        node.dispatchEvent(event);
        expect(called).to.be(true);
        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should remove a binding when disposed', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        binding.dispose();
        expect(called).to.be(false);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should emit a binding changed signal when added and removed', () => {
        let node = createElement();
        let added = false;
        let command = commands.addCommand('test', { execute: () => { } });
        let handler = (sender: any, args: any) => {
          added = (args as Keymap.IBindingChangedArgs).type === 'added';
        };
        keymap.bindingChanged.connect(handler);
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        expect(added).to.be(true);
        binding.dispose();
        expect(added).to.be(false);
        keymap.bindingChanged.disconnect(handler);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should throw an error if binding has an invalid selector', () => {
        let command = commands.addCommand('test', { execute: () => { } });
        let options = { keys: ['Ctrl ;'], selector: '..', command: 'test' };
        expect(() => { keymap.addBinding(options); }).to.throwError();
        command.dispose();
      });

    });

    describe('#findBinding()', () => {

      it('should find a key binding based on command and args', () => {
        let c1 = commands.addCommand('c1', { execute: () => { } });
        let c2 = commands.addCommand('c2', { execute: () => { } });
        let a1: JSONObject = { 'foo': 'bar' };
        let a2: JSONObject = { 'bar': 'baz' };
        let a3: JSONObject = { 'baz': 'qux' };
        let a4 = null;
        let b1 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b1',
          command: 'c1',
          args: a1
        });
        let b2 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b2',
          command: 'c1',
          args: a2
        });
        let b3 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b3',
          command: 'c1',
          args: a3
        });
        let b4 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.b4',
          command: 'c2',
          args: a4
        });
        expect(keymap.findBinding('c1', a1)!.selector).to.be('.b1');
        expect(keymap.findBinding('c1', a2)!.selector).to.be('.b2');
        expect(keymap.findBinding('c1', a3)!.selector).to.be('.b3');
        expect(keymap.findBinding('c2', a4)!.selector).to.be('.b4');
        b1.dispose();
        b2.dispose();
        b3.dispose();
        b4.dispose();
        c1.dispose();
        c2.dispose();
      });

      it('should remove a binding when disposed', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        binding.dispose();
        expect(called).to.be(false);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should emit a binding changed signal when added and removed', () => {
        let node = createElement();
        let added = false;
        let command = commands.addCommand('test', { execute: () => { } });
        let handler = (sender: any, args: any) => {
          added = (args as Keymap.IBindingChangedArgs).type === 'added';
        };
        keymap.bindingChanged.connect(handler);
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        expect(added).to.be(true);
        binding.dispose();
        expect(added).to.be(false);
        keymap.bindingChanged.disconnect(handler);
        command.dispose();
        document.body.removeChild(node);
      });

      it('should throw an error if binding has an invalid selector', () => {
        let command = commands.addCommand('test', { execute: () => { } });
        let options = { keys: ['Ctrl ;'], selector: '..', command: 'test' };
        expect(() => { keymap.addBinding(options); }).to.throwError();
        command.dispose();
      });

    });

    describe('#processKeydownEvent()', () => {

      it('should dispatch on a correct keyboard event', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });

        node.dispatchEvent(event);
        expect(called).to.be(true);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should not dispatch on a non-matching keyboard event', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 45, ctrlKey: true });

        node.dispatchEvent(event);
        expect(called).to.be(false);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should not dispatch with non-matching modifiers', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count = 0;
        let command = commands.addCommand('test', {
          execute: () => { count++; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl S'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let eventAlt = generate('keydown', { keyCode: 83, altKey: true });
        let eventShift = generate('keydown', { keyCode: 83, shiftKey: true });

        node.dispatchEvent(eventAlt);
        expect(count).to.be(0);
        node.dispatchEvent(eventShift);
        expect(count).to.be(0);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should dispatch with multiple chords in a key sequence', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count = 0;
        let command = commands.addCommand('test', {
          execute: () => { count++; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl K', 'Ctrl L'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let eventK = generate('keydown', { keyCode: 75, ctrlKey: true });
        let eventL = generate('keydown', { keyCode: 76, ctrlKey: true });

        node.dispatchEvent(eventK);
        expect(count).to.be(0);
        node.dispatchEvent(eventL);
        expect(count).to.be(1);
        node.dispatchEvent(generate('keydown', eventL)); // Don't reuse; clone.
        expect(count).to.be(1);
        node.dispatchEvent(generate('keydown', eventK)); // Don't reuse; clone.
        expect(count).to.be(1);
        node.dispatchEvent(generate('keydown', eventL)); // Don't reuse; clone.
        expect(count).to.be(2);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should not execute handler without matching selector', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count = 0;
        let command = commands.addCommand('test', {
          execute: () => { count++; }
        });
        let binding = keymap.addBinding({
          keys: ['Shift P'],
          selector: '.inaccessible-scope',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 80, shiftKey: true });

        expect(count).to.be(0);
        node.dispatchEvent(event);
        expect(count).to.be(0);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should not execute a handler when missing a modifier', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count = 0;
        let command = commands.addCommand('test', {
          execute: () => { count++; }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl P'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 17 });

        expect(count).to.be(0);
        node.dispatchEvent(event);
        expect(count).to.be(0);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
      });

      it('should register partial and exact matches', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count1 = 0;
        let count2 = 0;
        let command1 = commands.addCommand('test1', {
          execute: () => { count1++; }
        });
        let command2 = commands.addCommand('test2', {
          execute: () => { count2++; }
        });
        let binding1 = keymap.addBinding({
          keys: ['Ctrl S'],
          selector: `#${node.id}`,
          command: 'test1'
        });
        let binding2 = keymap.addBinding({
          keys: ['Ctrl S', 'Ctrl D'],
          selector: `#${node.id}`,
          command: 'test2'
        });
        let event1 = generate('keydown', { keyCode: 83, ctrlKey: true });
        let event2 = generate('keydown', { keyCode: 68, ctrlKey: true });

        expect(count1).to.be(0);
        expect(count2).to.be(0);
        node.dispatchEvent(event1);
        expect(count1).to.be(0);
        expect(count2).to.be(0);
        node.dispatchEvent(event2);
        expect(count1).to.be(0);
        expect(count2).to.be(1);

        binding1.dispose();
        binding2.dispose();
        command1.dispose();
        command2.dispose();
        document.body.removeChild(node);
      });

      it('should recognize permutations of modifiers', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let count1 = 0;
        let count2 = 0;
        let command1 = commands.addCommand('test1', {
          execute: () => { count1++; }
        });
        let command2 = commands.addCommand('test2', {
          execute: () => { count2++; }
        });
        let binding1 = keymap.addBinding({
          keys: ['Shift Alt Ctrl T'],
          selector: `#${node.id}`,
          command: 'test1'
        });
        let binding2 = keymap.addBinding({
          keys: ['Alt Shift Ctrl Q'],
          selector: `#${node.id}`,
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

        expect(count1).to.be(0);
        node.dispatchEvent(event1);
        expect(count1).to.be(1);
        expect(count2).to.be(0);
        node.dispatchEvent(event2);
        expect(count2).to.be(1);

        binding1.dispose();
        binding2.dispose();
        command1.dispose();
        command2.dispose();
        document.body.removeChild(node);
      });

      it('should play back a partial match that was not completed', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => { codes.push(event.keyCode); };
        document.body.addEventListener('keydown', keydown);

        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['D', 'D'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event1 = generate('keydown', { keyCode: 68 });
        let event2 = generate('keydown', { keyCode: 69 });

        node.dispatchEvent(event1);
        expect(codes.length).to.be(0);
        node.dispatchEvent(event2);
        expect(called).to.be(false);
        expect(codes).to.eql([68, 69]);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
        document.body.removeEventListener('keydown', keydown);
      });

      it('should play back a partial match that times out', (done) => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => { codes.push(event.keyCode); };
        document.body.addEventListener('keydown', keydown);

        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['D', 'D'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });

        node.dispatchEvent(event);
        expect(codes.length).to.be(0);

        setTimeout(() => {
          expect(codes).to.eql([68]);
          expect(called).to.be(false);

          binding.dispose();
          command.dispose();
          document.body.removeChild(node);
          document.body.removeEventListener('keydown', keydown);
          done();
        }, 1300);
      });

      it('should resolve an exact match of partial match time out', (done) => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let called1 = false;
        let called2 = false;
        let command1 = commands.addCommand('test1', {
          execute: () => { called1 = true; }
        });
        let command2 = commands.addCommand('test2', {
          execute: () => { called2 = true; }
        });
        let binding1 = keymap.addBinding({
          keys: ['D', 'D'],
          selector: `#${node.id}`,
          command: 'test1'
        });
        let binding2 = keymap.addBinding({
          keys: ['D'],
          selector: `#${node.id}`,
          command: 'test2'
        });
        let event = generate('keydown', { keyCode: 68 });

        node.dispatchEvent(event);
        expect(called1).to.be(false);
        expect(called2).to.be(false);

        setTimeout(() => {
          expect(called1).to.be(false);
          expect(called2).to.be(true);

          command1.dispose();
          command2.dispose();
          binding1.dispose();
          binding2.dispose();
          document.body.removeChild(node);
          done();
        }, 1300);
      });

      it('should safely process when an error occurs', () => {
        let node = createElement();
        let called = false;
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
          called = true;
        });

        let command = commands.addCommand('test', {
          execute: () => { throw new Error(); }
        });
        let binding = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });

        node.dispatchEvent(event);
        expect(called).to.be(true);

        command.dispose();
        binding.dispose();
        document.body.removeChild(node);
      });

      it('should pick the selector with greater specificity', () => {
        let node = createElement();
        node.classList.add('test');
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let called1 = false;
        let called2 = false;
        let command1 = commands.addCommand('test1', {
          execute: () => { called1 = true; }
        });
        let command2 = commands.addCommand('test2', {
          execute: () => { called2 = true; }
        });
        let binding1 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: '.test',
          command: 'test1'
        });
        let binding2 = keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test2'
        });
        let event = generate('keydown', { keyCode: 59, ctrlKey: true });

        node.dispatchEvent(event);
        expect(called1).to.be(false);
        expect(called2).to.be(true);

        command1.dispose();
        command2.dispose();
        binding1.dispose();
        binding2.dispose();
        document.body.removeChild(node);
      });

      it('should propagate if partial binding selector does not match', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => {
          codes.push(event.keyCode);
        };
        document.body.addEventListener('keydown', keydown);


        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['D', 'D'],
          selector: '#baz',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });

        node.dispatchEvent(event);
        expect(codes).to.eql([68]);
        expect(called).to.be(false);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
        document.body.removeEventListener('keydown', keydown);
      });

      it('should propagate if exact binding selector does not match', () => {
        let node = createElement();
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });

        let codes: number[] = [];
        let keydown = (event: KeyboardEvent) => {
          codes.push(event.keyCode);
        };
        document.body.addEventListener('keydown', keydown);


        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        let binding = keymap.addBinding({
          keys: ['D'],
          selector: '#baz',
          command: 'test'
        });
        let event = generate('keydown', { keyCode: 68 });

        node.dispatchEvent(event);
        expect(codes).to.eql([68]);
        expect(called).to.be(false);

        binding.dispose();
        command.dispose();
        document.body.removeChild(node);
        document.body.removeEventListener('keydown', keydown);
      });

    });

  });

  describe('.keystrokeForKeydownEvent()', () => {

    it('should create a normalized keystroke', () => {
      let event = generate('keydown', { ctrlKey: true, keyCode: 83 });
      let keystroke = Keymap.keystrokeForKeydownEvent(event as KeyboardEvent, EN_US);
      expect(keystroke).to.be('Ctrl S');
    });

    it('should handle multiple modifiers', () => {
      let event = generate('keydown', {
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        keyCode: 83
      });
      let keystroke = Keymap.keystrokeForKeydownEvent(event as KeyboardEvent, EN_US);
      expect(keystroke).to.be('Ctrl Alt Shift S');
    });

    it('should fail on an invalid shortcut', () => {
      let event = generate('keydown', { keyCode: -1 });
      let keystroke = Keymap.keystrokeForKeydownEvent(event as KeyboardEvent, EN_US);
      expect(keystroke).to.be('');
    });

  });

  describe('.normalizeKeystroke()', () => {

    it('should normalize and validate a keystroke', () => {
      let stroke = Keymap.normalizeKeystroke('Ctrl S');
      expect(stroke).to.be('Ctrl S');
    });

    it('should handle multiple modifiers', () => {
      let stroke = Keymap.normalizeKeystroke('Ctrl Shift Alt S');
      expect(stroke).to.be('Ctrl Alt Shift S');
    });

    it('should handle platform specific modifiers', () => {
      let stroke = '';
      if (IS_MAC) {
        stroke = Keymap.normalizeKeystroke('Cmd S');
        expect(stroke).to.be('Cmd S');
        stroke = Keymap.normalizeKeystroke('Accel S');
        expect(stroke).to.be('Cmd S');
      } else {
        stroke = Keymap.normalizeKeystroke('Cmd S');
        expect(stroke).to.be('S');
        stroke = Keymap.normalizeKeystroke('Accel S');
        expect(stroke).to.be('Ctrl S');
      }
    });

  });

  describe('.formatKeystroke()', () => {

    it('should format a keystroke', () => {
      let stroke = Keymap.formatKeystroke('Accel Ctrl Alt Shift S');
      if (IS_MAC) {
        expect(stroke).to.be('\u2303\u2325\u21E7\u2318S');
      } else {
        expect(stroke).to.be('Ctrl+Alt+Shift+S');
      }
    });

  });

});
