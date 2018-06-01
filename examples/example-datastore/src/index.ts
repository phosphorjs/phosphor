/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import '../style/index.css';

import {
  IMessageHandler, Message
} from '@phosphor/messaging';

import {
  WSServerAdapter
} from './serveradapterimpl';

const WS_URL = 'ws://localhost:8081';

function main() {
  const wsFactory = () => {
    const ws = new WebSocket(WS_URL);
    (window as any).ws = ws;
    return ws;
  };

  const serverAdapter = new WSServerAdapter(wsFactory);
  const messageHandler: IMessageHandler = {
    processMessage: (msg: Message) => {
      console.log(msg);
    }
  };
  console.log('Creating store');
  serverAdapter.createStoreId().then(id => {
    console.log(`Created store with id: ${id}`);
    serverAdapter.registerPatchHandler(id, messageHandler);

    document.getElementById('button')!.addEventListener("click", () => {
      let patch =  {
        patchId: serverAdapter.createPatchId(),
        storeId: id,
        content: {
          value: 3.14159
        }
      };
      console.log(`Patching: ${patch}`);
      serverAdapter.broadcastPatch(patch);
    });
  });
}


window.onload = main;
