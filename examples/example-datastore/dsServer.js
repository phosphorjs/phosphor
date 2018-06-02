const WebSocket = require('ws');
const patchDB = new Map();
let numStores = 0;

const wss = new WebSocket.Server({ port: 8081 });

function storeId(msg) {
  return {
    msgType: 'storeid-reply',
    parentId: msg.msgId,
    content: {
      storeId: numStores++
    }
  }
}

function patchBroadcast(msg, ws) {
  // Broadcast the patch to everyone.
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
  console.log('Broadcasted: ', JSON.stringify(msg));

  // Store the patch for later retreival
  patchDB.set(msg.content.patch.patchId, msg.content.patch);
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
 ws.on('message', function incoming(data) {
  console.log('received: ', data);
  let reply = null;
  const msg = JSON.parse(data);
  switch(msg.msgType) {
  case 'storeid-request':
    reply = storeId(msg);
    break;
  case 'patch-broadcast':
    patchBroadcast(msg, ws);
    break;
  case 'patch-history-request':
    reply = patchHistory(msg);
    break;
  case 'fetch-patch-request':
    reply = patchRequest(msg);
    break;
  default:
    console.error('unhandled message: ', JSON.stringify(msg));
  }
  if (reply) {
    console.log('Reply: ', JSON.stringify(reply));
    ws.send(JSON.stringify(reply));
  }
});
});
