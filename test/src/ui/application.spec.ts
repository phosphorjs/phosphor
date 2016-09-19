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
  Token
} from '../../../lib/core/token';

import {
  Application
} from '../../../lib/ui/application';

import {
  CommandRegistry
} from '../../../lib/ui/commandregistry';

import {
  Keymap
} from '../../../lib/ui/keymap';

import {
  Widget
} from '../../../lib/ui/widget';

import {
  LogWidget
} from './widget.spec';


class TestApplication extends Application<LogWidget> {

  events: string[] = [];
  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected createShell(): LogWidget {
    this.methods.push('createShell');
    return new LogWidget();
  }

  protected attachShell(id: string): void {
    super.attachShell(id);
    this.methods.push('attachShell');
  }

  protected addEventListeners(): void {
    super.addEventListeners();
    this.methods.push('addEventListeners');
  }

  protected evtKeydown(event: KeyboardEvent): void {
    super.evtKeydown(event);
    this.methods.push('evtKeydown');
  }

  protected evtResize(event: Event): void {
    super.evtResize(event);
    this.methods.push('evtResize');
  }
}


const FOO = new Token<string>('foo');


describe('ui/application', () => {

  let app: TestApplication;

  beforeEach(() => {
    app = new TestApplication();
  });

  describe('Application', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        expect(app).to.be.an(Application);
      });

    });

    describe('#shell', () => {

      it('should get the application shell widget', () => {
        app.start();
        expect(app.shell).to.be.a(Widget);
      });

      it('should be `null` until the application is started', () => {
        expect(app.shell).to.be(null);
      });

    });

    describe('#commands', () => {

      it('should get the application command registry', () => {
        expect(app.commands).to.be.a(CommandRegistry);
      });

    });

    describe('#keymap', () => {

      it('should get the application keymap', () => {
        expect(app.keymap).to.be.a(Keymap);
      });

    });

    describe('#hasPlugin()', () => {

      it('should test whether a plugin is registered with the application', () => {
        expect(app.hasPlugin('foo')).to.be(false);
        app.registerPlugin({
          id: 'foo',
          activate: () => { /* no-op */ }
        });
        expect(app.hasPlugin('foo')).to.be(true);
      });
    });

    describe('#listPlugins()', () => {

      it('should list the IDs of the plugins registered with the application', () => {
        expect(app.listPlugins()).to.eql([]);
        ['foo', 'bar'].map(name => {
          app.registerPlugin({
            id: name,
            activate: () => { /* no-op */ }
          });
        });
        expect(app.listPlugins()).to.eql(['foo', 'bar']);
      });

    });

    describe('#registerPlugin()', () => {

      it('should register a plugin with the application', () => {
        app.registerPlugin({
          id: 'foo',
          activate: () => { /* no-op */ }
        });
        expect(app.hasPlugin('foo')).to.be(true);
      });

      it('should throw an error if a plugin with the same id is already registered', () => {
        app.registerPlugin({
          id: 'foo',
          activate: () => { /* no-op */ }
        });
        expect(() => {
          app.registerPlugin({
            id: 'foo',
            activate: () => { /* no-op */ }
          });
        }).to.throwError();
      });

      it('should throw an error if the plugin has a circular dependency', () => {
        expect(() => {
          app.registerPlugin({
            id: 'foo',
            requires: [FOO],
            provides: FOO,
            activate: () => { return 'hi from foo'; }
          });
        }).to.throwError();
      });

      it('should override a service provided by another plugin', (done) => {
        app.registerPlugin({
          id: 'foo',
          provides: FOO,
          activate: () => { return 'hi from foo'; }
        });
        app.registerPlugin({
          id: 'bar',
          provides: FOO,
          activate: () => { return 'hi from bar'; }
        });
        app.registerPlugin({
          id: 'baz',
          requires: [FOO],
          autoStart: true,
          activate: (test: TestApplication, foo: string) => {
            expect(foo).to.be('hi from bar');
            done();
          }
        });
        app.start();
      });

    });

    describe('#registerPlugins', () => {

      it('should register multiple plugins with the application', () => {
        app.registerPlugins([
          {
            id: 'foo',
            activate: () => { /* no-op */ }
          },
          {
            id: 'bar',
            activate: () => { /* no-op */ }
          }
        ]);
        expect(app.listPlugins()).to.eql(['foo', 'bar']);
      });

    });

    describe('#activatePlugin()', () => {

      it('should activate the plugin with the given id', (done) => {
        app.registerPlugin({
          id: 'foo',
          activate: () => { return 'foo'; }
        });
        app.activatePlugin('foo').then(done, done);
      });

      it('should reject if it cannot be activated', (done) => {
        app.activatePlugin('foo').catch(() => { done(); });
      });

    });

    describe('#resolveService()', () => {

      it('should resolve a service of a given type', (done) => {
        app.registerPlugin({
          id: 'foo',
          provides: FOO,
          activate: () => { return 'hi from foo'; }
        });
        app.resolveService(FOO).then(value => {
          expect(value).to.be('hi from foo');
          done();
        }).catch(done);
      });

      it('should reject with an error if it cannot be resolved', (done) => {
        app.resolveService(FOO).catch(() => { done(); });
      });

      it('should return the same instance each time a given service token is resolved', (done) => {
        let called = 0;
        app.registerPlugin({
          id: 'foo',
          provides: FOO,
          activate: () => { return `hi from foo ${++called}`; }
        });
        app.resolveService(FOO).then(value => {
          expect(value).to.be('hi from foo 1');
          return app.resolveService(FOO).then(value2 => {
            expect(value2).to.be('hi from foo 1');
            done();
          });
        }).catch(done);
      });

    });

    describe('#start()', () => {

      it('should create the shell widget', () => {
        expect(app.shell).to.be(null);
        app.start();
        expect(app.shell).to.be.a(Widget);
      });

      it('should resolve when the startup plugins have activated', (done) => {
        let called = 0;
        app.registerPlugins([
          {
            id: 'foo',
            autoStart: true,
            activate: () => {
              called++;
              return Promise.resolve(void 0);
            }
          },
          {
            id: 'bar',
            autoStart: true,
            activate: () => {
              called++;
              return Promise.resolve(void 0);
            }
          }
        ]);
        app.start().then(() => {
          expect(called).to.be(2);
          done();
        }).catch(done);
      });

      it('should mount the shell to the DOM', (done) => {
        app.start().then(() => {
          expect(app.shell.isAttached).to.be(true);
          done();
        }).catch(done);
      });

      it('should attach the cell to the node with a given id', (done) => {
        let node = document.createElement('div');
        node.id = 'foo';
        document.body.appendChild(node);
        app.start({ hostID: 'foo' }).then(() => {
          expect(node.firstChild).to.be(app.shell.node);
          document.body.removeChild(node);
          done();
        }).catch(done);
      });

      it('should activate plugins by name', (done) => {
        let called: string[] = [];
        app.registerPlugins([
          {
            id: 'foo',
            activate: () => { called.push('foo'); }
          },
          {
            id: 'bar',
            activate: () => { called.push('bar'); }
          }
        ]);
        app.start({ startPlugins: ['foo'] }).then(() => {
          expect(called).to.eql(['foo']);
          done();
        }).catch(done);
      });

      it('should ignore plugins by name', (done) => {
        let called: string[] = [];
        app.registerPlugins([
          {
            id: 'foo',
            autoStart: true,
            activate: () => { called.push('foo'); }
          },
          {
            id: 'bar',
            autoStart: true,
            activate: () => { called.push('bar'); }
          }
        ]);
        app.start({ ignorePlugins: ['foo'] }).then(() => {
          expect(called).to.eql(['bar']);
          done();
        }).catch(done);
      });

      it('should attach event listeners', (done) => {
        app.start().then(() => {
          simulate(window, 'resize');
          expect(app.events).to.contain('resize');
          simulate(document.body, 'keydown');
          expect(app.events).to.contain('keydown');
          done();
        }).catch(done);
      });

    });

    describe('#createShell()', () => {

      it('should be called during start', (done) => {
        app.start().then(() => {
          expect(app.methods).to.contain('createShell');
          done();
        }).catch(done);
      });

    });

    describe('#attachShell()', () => {

      it('should be called during start', (done) => {
        app.start().then(() => {
          expect(app.methods).to.contain('attachShell');
          done();
        }).catch(done);
      });

      it('should attach to document.body by default', (done) => {
        app.start().then(() => {
          expect(app.shell.node.parentNode).to.be(document.body);
          done();
        }).catch(done);
      });

      it('should attach the cell to the node with a given id', (done) => {
        let node = document.createElement('div');
        node.id = 'foo';
        document.body.appendChild(node);
        app.start({ hostID: 'foo' }).then(() => {
          expect(node.firstChild).to.be(app.shell.node);
          document.body.removeChild(node);
          done();
        }).catch(done);
      });

    });

    describe('#addEventListeners()', () => {

      it('should add listeners for \'keydown\' and \'resize\' events', (done) => {
        app.start().then(() => {
          expect(app.methods).to.contain('addEventListeners');
          simulate(window, 'resize');
          expect(app.events).to.contain('resize');
          simulate(document.body, 'keydown');
          expect(app.events).to.contain('keydown');
          done();
        }).catch(done);
      });

    });

    describe('#evtKeydown()', () => {

      it('should be invoked on a document \'keydown\' event', (done) => {
        app.start().then(() => {
          simulate(document.body, 'keydown');
          expect(app.methods).to.contain('evtKeydown');
          done();
        }).catch(done);
      });

      it('should invoke the key down processing of the application keymap', (done) => {
        let called = false;
        app.commands.addCommand('test', {
          execute: () => { called = true; }
        });
        app.keymap.addBinding({
          keys: ['Enter'],
          selector: `body`,
          command: 'test'
        });
        app.start().then(() => {
          simulate(document.body, 'keydown', { keyCode: 13 });
          expect(called).to.be(true);
          done();
        }).catch(done);
      });

    });

    describe('#evtResize()', () => {

      it('should be invoked on a window \'resize\' event', (done) => {
        app.start().then(() => {
          simulate(window, 'resize');
          expect(app.methods).to.contain('evtResize');
          done();
        }).catch(done);
      });

      it('should post an update to the shell', (done) => {
        app.start().then(() => {
          simulate(window, 'resize');
          requestAnimationFrame(() => {
            expect(app.shell.messages).to.contain('update-request');
            done();
          });
        }).catch(done);
      });

    });

  });

});
