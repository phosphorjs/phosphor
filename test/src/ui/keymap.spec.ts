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
  keymap, KeymapManager
} from '../../../lib/ui/keymap';

import {
  EN_US, KeycodeLayout
} from '../../../lib/ui/keyboard';

import {
  Vector
} from '../../../lib/collections/vector';


/**
 * Helper function to generate keyboard events for unit-tests.
 */
function genKeyboardEvent(options: any): KeyboardEvent {
  let event = document.createEvent('Events') as KeyboardEvent;
  let bubbles = options.bubbles || true;
  let cancelable = options.cancelable || true;
  event.initEvent(options.type || 'keydown', bubbles, cancelable);
  event.keyCode = options.keyCode || 0;
  event.key = options.key || '';
  event.which = event.keyCode;
  event.ctrlKey = options.ctrlKey || false;
  event.altKey = options.altKey || false;
  event.shiftKey = options.shiftKey || false;
  event.metaKey = options.metaKey || false;
  event.view = options.view || window;
  return event;
}

let id = 0;


/**
 * A flag indicating whether the platform is Mac.
 */
var IS_MAC = !!navigator.platform.match(/Mac/i);


/**
 * Create an element with a unique id and add to the document.
 */
function createElement(): HTMLElement {
  let el = document.createElement('div');
  (el as any).id = `test${id++}`;
  document.body.appendChild(el);
  return el;
}


describe('ui/keymap', () => {

  describe('KeymapManager', () => {

    describe('static instance', () => {

      it('should be a keymap manager', () => {
        expect(keymap).to.be.a(KeymapManager);
      })

    });

    describe('#layout', () => {

      it('should be a keycode layout', () => {
        expect(keymap.layout instanceof KeycodeLayout).to.be(true);
      });

      it('should default to `EN_US` layout', () => {
        expect(keymap.layout).to.be(EN_US);
      });

      it('should reset to `EN_US` if set to `null`', () => {
        keymap.layout = null;
        expect(keymap.layout).to.be(EN_US);
      });

    });

    describe('#bindings', () => {

      it('should be a vector', () => {
        expect(keymap.bindings instanceof Vector).to.be(true);
      });

      it('should be read only', () => {
        expect(() => { keymap.bindings = null }).to.throwError();
      });

    });

    describe('#addBinding()', () => {

      it('should add key bindings to the keymap manager', () => {
        let node = createElement();
        let called = false;
        let command = commands.addCommand('test', {
          execute: () => { called = true; }
        });
        node.addEventListener('keydown', event => {
          keymap.processKeydownEvent(event);
        });
        keymap.addBinding({
          keys: ['Ctrl ;'],
          selector: `#${node.id}`,
          command: 'test'
        });
        let keyEvent = genKeyboardEvent({ keyCode: 59, ctrlKey: true });
        node.dispatchEvent(keyEvent);
        expect(called).to.be(true);
        command.dispose();
        document.body.removeChild(node);
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
          added = (args as KeymapManager.IBindingChangedArgs).type === 'added';
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

    });

  });

});
