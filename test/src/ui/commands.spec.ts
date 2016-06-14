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
  CommandRegistry, commands
} from '../../../lib/ui/commands';


const NULL_COMMAND = {
  execute: (args: JSONObject) => { return args; }
};


describe('ui/commands', () => {

  describe('CommandRegistry', () => {

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let registry = new CommandRegistry();
        expect(registry instanceof CommandRegistry).to.be(true);
      });

    });

    describe('#commandChanged', () => {

      it('should be emitted when a command is added', () => {
        let registry = new CommandRegistry();
        let called = false;
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.be(registry);
          expect(args.id).to.be('test');
          expect(args.type).to.be('added');
          called = true;
        });
        registry.addCommand('test', NULL_COMMAND);
        expect(called).to.be(true);
      });

      it('should be emitted when a command is changed', () => {
        let registry = new CommandRegistry();
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.be(registry);
          expect(args.id).to.be('test');
          expect(args.type).to.be('changed');
          called = true;
        });
        registry.notifyCommandChanged('test');
        expect(called).to.be(true);
      });

      it('should be emitted when a command is removed', () => {
        let registry = new CommandRegistry();
        let called = false;
        let disposable = registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.be(registry);
          expect(args.id).to.be('test');
          expect(args.type).to.be('removed');
          called = true;
        });
        disposable.dispose();
        expect(called).to.be(true);
      });

    });

    describe('#commandExecuted', () => {

      it('should be emitted when a command is executed', () => {
        let registry = new CommandRegistry();
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandExecuted.connect((reg, args) => {
          expect(reg).to.be(registry);
          expect(args.id).to.be('test');
          expect(args.args).to.be(null);
          called = true;
        });
        registry.execute('test', null);
        expect(called).to.be(true);
      });

    });

    describe('#listCommands()', () => {

      it('should list the ids of the registered commands', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test0', NULL_COMMAND);
        registry.addCommand('test1', NULL_COMMAND);
        expect(registry.listCommands()).to.eql(['test0', 'test1']);
      });

      it('should be a new array', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test0', NULL_COMMAND);
        registry.addCommand('test1', NULL_COMMAND);
        let cmds = registry.listCommands();
        cmds.push('test2');
        expect(registry.listCommands()).to.eql(['test0', 'test1']);
      });

    });

    describe('#hasCommand()', () => {

      it('should test whether a specific command is registerd', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.hasCommand('test')).to.be(true);
        expect(registry.hasCommand('foo')).to.be(false);
      });

    });

    describe('#addCommand()', () => {

      it('should add a command to the registry', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.hasCommand('test')).to.be(true);
      });

      it('should return a disposable which will unregister the command', () => {
        let registry = new CommandRegistry();
        let disposable = registry.addCommand('test', NULL_COMMAND);
        disposable.dispose();
        expect(registry.hasCommand('test')).to.be(false);
      });

      it('should throw an error if the given `id` is already registered', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(() => {
          registry.addCommand('test', NULL_COMMAND);
        }).to.throwError();
      });

      it('should clone the `cmd` before adding it to the registry', () => {
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          label: 'foo'
        };
        let registry = new CommandRegistry();
        registry.addCommand('test', cmd);
        cmd.label = 'bar';
        expect(registry.label('test', null)).to.be('foo');
      });

    });

    describe('#notifyCommandChanged()', () => {

      it('should emit the `commandChanged` signal for the command', () => {
        let registry = new CommandRegistry();
        let called = false;
        registry.addCommand('test', NULL_COMMAND);
        registry.commandChanged.connect((reg, args) => {
          expect(reg).to.be(registry);
          expect(args.id).to.be('test');
          expect(args.type).to.be('changed');
          called = true;
        });
        registry.notifyCommandChanged('test');
        expect(called).to.be(true);
      });

      it('should be a no-op if the command is not registered', () => {
        let registry = new CommandRegistry();
        let called = false;
        registry.commandChanged.connect((reg, args) => {
          called = true;
        });
        registry.notifyCommandChanged('foo');
        expect(called).to.be(false);
      });

    });

    describe('#label()', () => {

      it('should get the display label for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          label: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.label('test', null)).to.be('foo');
      });

      it('should give the appropriate label given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          label: (args: JSONObject) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.label('test', null)).to.be('null');
      });

      it('should return an empty string if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.label('foo', null)).to.be('');
      });

      it('should default to an empty string for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.label('test', null)).to.be('');
      });

    });

    describe('#mnemonic()', () => {

      it('should get the mnemonic index for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          mnemonic: 1
        };
        registry.addCommand('test', cmd);
        expect(registry.mnemonic('test', null)).to.be(1);
      });

      it('should give the appropriate mnemonic given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          mnemonic: (args: JSONObject) => { return JSON.stringify(args).length; }
        };
        registry.addCommand('test', cmd);
        expect(registry.mnemonic('test', null)).to.be(4);
      });

      it('should return a `-1` if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.mnemonic('foo', null)).to.be(-1);
      });

      it('should default to `-1` for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.mnemonic('test', null)).to.be(-1);
      });

    });

    describe('#icon()', () => {

      it('should get the icon for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          icon: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.icon('test', null)).to.be('foo');
      });

      it('should give the appropriate icon given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          icon: (args: JSONObject) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.icon('test', null)).to.be('null');
      });

      it('should return an empty string if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.icon('foo', null)).to.be('');
      });

      it('should default to an empty string for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.icon('test', null)).to.be('');
      });

    });

    describe('#caption()', () => {

      it('should get the caption for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          caption: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.caption('test', null)).to.be('foo');
      });

      it('should give the appropriate caption given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          caption: (args: JSONObject) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.caption('test', null)).to.be('null');
      });

      it('should return an empty string if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.caption('foo', null)).to.be('');
      });

      it('should default to an empty string for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.caption('test', null)).to.be('');
      });

    });

    describe('#usage()', () => {

      it('should get the usage text for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          usage: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.usage('test', null)).to.be('foo');
      });

      it('should give the appropriate usage text given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          usage: (args: JSONObject) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.usage('test', null)).to.be('null');
      });

      it('should return an empty string if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.usage('foo', null)).to.be('');
      });

      it('should default to an empty string for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.usage('test', null)).to.be('');
      });

    });

    describe('#className()', () => {

      it('should get the extra class name for a specific command', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          className: 'foo'
        };
        registry.addCommand('test', cmd);
        expect(registry.className('test', null)).to.be('foo');
      });

      it('should give the appropriate class name given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          className: (args: JSONObject) => { return JSON.stringify(args); }
        };
        registry.addCommand('test', cmd);
        expect(registry.className('test', null)).to.be('null');
      });

      it('should return an empty string if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.className('foo', null)).to.be('');
      });

      it('should default to an empty string for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.className('test', null)).to.be('');
      });

    });

    describe('#isEnabled()', () => {

      it('should test whether a specific command is enabled', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isEnabled: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isEnabled('test', null)).to.be(true);
      });

      it('should give the appropriate value given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isEnabled: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isEnabled('test', {})).to.be(false);
      });

      it('should return `false` if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.isEnabled('foo', null)).to.be(false);
      });

      it('should default to `true` for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isEnabled('test', null)).to.be(true);
      });

    });

    describe('#isToggled()', () => {

      it('should test whether a specific command is toggled', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isToggled: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isToggled('test', null)).to.be(true);
      });

      it('should give the appropriate value given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isToggled: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isToggled('test', {})).to.be(false);
      });

      it('should return `false` if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.isToggled('foo', null)).to.be(false);
      });

      it('should default to `false` for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isToggled('test', null)).to.be(false);
      });

    });

    describe('#isVisible()', () => {

      it('should test whether a specific command is visible', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isVisible('test', null)).to.be(true);
      });

      it('should give the appropriate value given arguments', () => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return args; },
          isVisible: (args: JSONObject) => { return args === null; }
        };
        registry.addCommand('test', cmd);
        expect(registry.isVisible('test', {})).to.be(false);
      });

      it('should return `false` if the command is not registered', () => {
        let registry = new CommandRegistry();
        expect(registry.isVisible('foo', null)).to.be(false);
      });

      it('should default to `true` for a command', () => {
        let registry = new CommandRegistry();
        registry.addCommand('test', NULL_COMMAND);
        expect(registry.isVisible('test', null)).to.be(true);
      });

    });

    describe('#execute()', () => {

      it('should execute a specific command', () => {
        let registry = new CommandRegistry();
        let called = false;
        let cmd = {
          execute: (args: JSONObject) => { called = true; },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null);
        expect(called).to.be(true);
      });

      it('should resolve with the result of the command', (done) => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { return Promise.resolve(null); },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null).then(result => {
          expect(result).to.be(null);
          done();
        });
      });

      it('should reject if the command throws an error', (done) => {
        let registry = new CommandRegistry();
        let cmd = {
          execute: (args: JSONObject) => { throw new Error(''); },
        };
        registry.addCommand('test', cmd);
        registry.execute('test', null).catch(() => {
          done();
        });
      });

      it('should reject if the command is not registered', (done) => {
        let registry = new CommandRegistry();
        registry.execute('foo', null).catch(() => {
          done();
        });
      });

    });

  });

  describe('commands', () => {

    it('should be an instance of `CommandRegistry`', () => {
      expect(commands instanceof CommandRegistry).to.be(true);
    });

  });

});
