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

/**
 * Create a HTTP static file server for serving the static
 * assets to the user.
 */
let pageServer = http.createServer((request, response) => {
  console.log("request starting...");

  let filePath = "." + request.url;
  if (filePath == "./") {
    filePath = "./index.html";
  }

  let extname = path.extname(filePath);
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

/**
 * Start the page server.
 */
pageServer.listen(8000, () => {
  console.info(new Date() + " Page server is listening on port 8000");
});

/**
 * Create a websocket server for the patch server.
 */
let httpServer = http.createServer((request, response) => {
  console.debug(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});
let wsServer = new WebSocketServer({
  httpServer,
  autoAcceptConnections: false,
  maxReceivedFrameSize: 10 * 1024 * 1024,
  maxReceivedMessageSize: 1000 * 1024 * 1024
});

/**
 * Start the patch server.
 */
httpServer.listen(8080, () => {
  console.info(new Date() + " Server is listening on port 8080");
});


function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

/**
 * A patch store for the server.
 */
class TransactionStore {
  /**
   * Construct a new patch store.
   */
  constructor() {
    this._transactions = {};
    this._order = [];
  }

  /**
   * Add a transaction to the patch store.
   *
   * @param The transaction to add to the store.
   *
   * @returns whether it was successfully added.
   */
  add(transaction: Datastore.Transaction): boolean {
    if (this._transactions.hasOwnProperty(transaction.id)) {
      return false;
    }
    this._transactions[transaction.id] = transaction;
    this._order.push(transaction.id);
    return true;
  }

  /**
   * Get a transaction by id.
   *
   * @param transactionId: the id of the transaction.
   *
   * @returns the transaction, or undefined if it can't be found.
   */
  get(transactionId: string): Datastore.Transaction | undefined {
    return this._transactions[transactionId];
  }

  /**
   * Get the entire history for the transaction store.
   *
   * @returns an array of transactions representing the whole history.
   */
  getHistory(): Datastore.Transaction[] {
    let history = new Array();
    for (let id of this._order) {
      history.push(this._transactions[id]);
    }
    return history;
  }

  private _order: string[];
  private _transactions: { [id: string]: Datastore.Transaction };
}

// Create a transaction store.
let store = new TransactionStore();
let idCounter = 0;

let connections: { [store: number]: connection } = {};

// Lifecycle for a collaborator.
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

  // Handle a message from a collaborator.
  connection.on("message", message => {
    if (message.type !== "utf8") {
      console.debug("Received non-UTF8 Message: " + message);
      return;
    }
    let data = JSON.parse(message.utf8Data!) as WSAdapterMessages.IMessage;
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
        let acks = [];
        let propagate = [];
        for (let t of data.content.transactions) {
          if (store.add(t)) {
            acks.push(t.id);
            propagate.push(t);
          }
        }
        let propMsgStr = JSON.stringify(
          WSAdapterMessages.createTransactionBroadcastMessage(propagate)
        );
        for (let storeId in connections) {
          let c = connections[storeId];
          if (c !== connection) {
            console.debug(`Broadcasting transactions to: ${storeId}`);
            c.sendUTF(propMsgStr);
          }
        }
        reply = WSAdapterMessages.createTransactionAckMessage(data.msgId, acks);
        break;
      case "history-request":
        let history = store.getHistory();
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

  // Handle a close event from a collaborator.
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
