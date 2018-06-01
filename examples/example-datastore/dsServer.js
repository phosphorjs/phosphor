const WebSocket = require('ws');
const patchDB = new Map();
storeId = 0;

const wss = new WebSocket.Server({ port: 8081 });

function generateStoreId(msg) {
  return {
    msgType: 'storeid-reply',
    parentId: msg.msgId,
    content: {
      storeId: storeId++
    }
  }
}

function patchBroadcast(msg, ws) {
  // Broadcast the patch to everyone.
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(msg.content.patch);
    }
  });

  // Store the patch for later retreival
  patchDB.set(msg.patch.patchId, msg.patch);

}

function patchHistory(msg) {
  return {
    msgType: 'patch-history-reply',
    parentId: msg.msgId,
    content: {
      patchHistory: {
        checkpoint: null,
        patches: Array.from(patchDB.values())
      }
    }
  }
}

function patchRequest(msg) {
  return {
    msgType: 'fetch-patch-reply',
    parentId: msg.msgId,
    content: {
      // Return the requested patches that exist.
      patches: msg.content.patchIds.map(id => patchDB.get(id)).filter(patch => patch !== undefined)
    }
  }
}

wss.on('connection', function connection(ws) {
 ws.on('message', function incoming(msg) {
  msg = JSON.parse(msg);
  switch(msg.msgType) {
  case 'storeid-request':
    ws.send(generateStoreId(msg));
    break;
  case 'patch-broadcast':
    patchBroadcast(msg, ws);
    break;
  case 'patch-history-request':
    ws.send(patchHistory(msg));
    break;
  case 'fetch-patch-request':
    ws.send(patchRequest(msg));
    break;
  default:
    console.error('unhandled message: ', msg.msgType);
  }
 });
});
