/*-----------------------------------------------------------------------------
| Copyright (c) 2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { Datastore } from "@phosphor/datastore";

import { server as WebSocketServer, connection } from "websocket";

import { WSAdapterMessages } from "./messages";

import * as fs from "fs";

import * as http from "http";

import * as path from "path";

const pageServer = http.createServer((request, response) => {
  console.log("request starting...");

  let filePath = "." + request.url;
  if (filePath == "./") {
    filePath = "./index.html";
  }

  const extname = path.extname(filePath);
  let contentType = "text/html";
  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error("Could not find file");
      response.writeHead(404, { "Content-Type": contentType });
      response.end();
    } else {
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content, "utf-8");
    }
  });
});

pageServer.listen(8000, () => {
  console.info(new Date() + " Page server is listening on port 8000");
});

const httpServer = http.createServer((request, response) => {
  console.debug(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});
httpServer.listen(8080, () => {
  console.info(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer,
  autoAcceptConnections: false,
  maxReceivedFrameSize: 10 * 1024 * 1024,
  maxReceivedMessageSize: 1000 * 1024 * 1024
});

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

class TransactionStore {
  /**
   *
   */
  constructor() {
    this._transactions = {};
    this._order = [];
  }

  /**
   *
   *
   * @param {Datastore.Transaction} transaction
   * @returns {boolean}
   */
  add(transaction: Datastore.Transaction): boolean {
    if (this._transactions.hasOwnProperty(transaction.id)) {
      return false;
    }
    this._transactions[transaction.id] = transaction;
    this._order.push(transaction.id);
    return true;
  }

  get(transactionId: string): Datastore.Transaction | undefined {
    return this._transactions[transactionId];
  }

  getHistory(): Datastore.Transaction[] {
    const history = new Array();
    for (let id of this._order) {
      history.push(this._transactions[id]);
    }
    return history;
  }

  private _order: string[];
  private _transactions: { [id: string]: Datastore.Transaction };
}

const store = new TransactionStore();
let idCounter = 0;

const connections: { [store: number]: connection } = {};

wsServer.on("request", request => {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.info(
      new Date() + " Connection from origin " + request.origin + " rejected."
    );
    return;
  }

  var connection = request.accept(undefined, request.origin);
  console.debug(new Date() + " Connection accepted.");
  connection.on("message", message => {
    if (message.type !== "utf8") {
      console.debug("Received non-UTF8 Message: " + message);
      return;
    }
    const data = JSON.parse(message.utf8Data!) as WSAdapterMessages.IMessage;
    console.debug(`Received message of type: ${data.msgType}`);
    let reply: WSAdapterMessages.IReplyMessage;
    switch (data.msgType) {
      case "storeid-request":
        connections[idCounter] = connection;
        reply = WSAdapterMessages.createStoreIdReplyMessage(
          data.msgId,
          idCounter++
        );
        break;
      case "transaction-broadcast":
        const acks = [];
        const propagate = [];
        for (let t of data.content.transactions) {
          if (store.add(t)) {
            acks.push(t.id);
            propagate.push(t);
          }
        }
        const propMsgStr = JSON.stringify(
          WSAdapterMessages.createTransactionBroadcastMessage(propagate)
        );
        for (let storeId in connections) {
          const c = connections[storeId];
          if (c !== connection) {
            console.debug(`Broadcasting transactions to: ${storeId}`);
            c.sendUTF(propMsgStr);
          }
        }
        reply = WSAdapterMessages.createTransactionAckMessage(data.msgId, acks);
        break;
      case "history-request":
        const history = store.getHistory();
        reply = WSAdapterMessages.createHistoryReplyMessage(data.msgId, {
          transactions: history
        });
        break;
      default:
        return;
    }
    console.debug(`Sending reply: ${reply.msgType}`);
    connection.sendUTF(JSON.stringify(reply));
  });
  connection.on("close", (reasonCode, description) => {
    let storeId;
    for (let id in connections) {
      if (connections[id] === connection) {
        storeId = id;
      }
    }
    console.debug(
      new Date() +
        ` Store ID ${storeId} disconnected. Reason: ${reasonCode}: ${description}`
    );
    for (let id in connections) {
      if (connections[id] === connection) {
        delete connections[id];
        break;
      }
    }
  });
});
