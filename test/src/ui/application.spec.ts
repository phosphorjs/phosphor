/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import expect = require('expect.js');

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


class TestApplication extends Application<Widget> {

  events: string[] = [];
  methods: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected createShell(): Widget {
    this.methods.push('createShell');
    return new Widget();
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
const BAR = new Token<number>('bar');


describe('ui/application', () => {

  describe('Application', () => {

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let app = new TestApplication();
        expect(app).to.be.an(Application);
      });

    });

    describe('#shell', () => {

      it('should get the application shell widget', () => {
        let app = new TestApplication();
        app.start();
        expect(app.shell).to.be.a(Widget);
      });

      it('should be `null` until the application is started', () => {
        let app = new TestApplication();
        expect(app.shell).to.be(null);
      });

    });

    describe('#commands', () => {

      it('should get the application command registry', () => {
        let app = new TestApplication();
        expect(app.commands).to.be.a(CommandRegistry);
      });

    });

    describe('#keymap', () => {

      it('should get the application keymap', () => {
        let app = new TestApplication();
        expect(app.keymap).to.be.a(Keymap);
      });

    });

    describe('#hasPlugin()', () => {

      it('should test whether a plugin is registered with the application', () => {
        let app = new TestApplication();
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
        let app = new TestApplication();
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
        let app = new TestApplication();
        app.registerPlugin({
          id: 'foo',
          activate: () => { /* no-op */ }
        });
        expect(app.hasPlugin('foo')).to.be(true);
      });

      it('should throw an error if a plugin with the same id is already registered', () => {
        let app = new TestApplication();
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
        let app = new TestApplication();
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
        let app = new TestApplication();
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
        let app = new TestApplication();
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
        let app = new TestApplication();
        app.registerPlugin({
          id: 'foo',
          activate: () => { return 'foo'; }
        });
        app.activatePlugin('foo').then(done, done);
      });

      it('should reject if it cannot be activated', (done) => {
        let app = new TestApplication();
        app.activatePlugin('foo').catch(() => { done(); });
      });

    });

    describe('#resolveService()', () => {

      it('should resolve a service of a given type', (done) => {
        let app = new TestApplication();
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
        let app = new TestApplication();
        app.resolveService(FOO).catch(() => { done(); });
      });

      it('should return the same instance each time a given service token is resolved', (done) => {
        let called = 0;
        let app = new TestApplication();
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

  });

});
