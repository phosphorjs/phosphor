/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each
} from './each';

import {
  Iterable
} from './iterable';


/**
 * Topologically sort an iterable of edges.
 *
 * @param edges - The iterable of edges to sort. An edge is represented
 *   as a 2-tuple of the form `[fromNode, toNode]`.
 *
 * @returns The topologically sorted array of nodes.
 *
 * #### Notes
 * If a cycle is present in the graph, the cycle will be ignored and
 * the return value will be only approximately sorted.
 *
 * #### Example
 * ```typescript
 * import { topSort } from '@phosphor/algorithm';
 *
 * let data = [
 *   ['d', 'e'],
 *   ['c', 'd'],
 *   ['a', 'b'],
 *   ['b', 'c']
 * ];
 *
 * topSort(data);  // ['a', 'b', 'c', 'd', 'e']
 */
export
function topSort(edges: Iterable<[string, string]>): string[] {
  // A type alias for an object hash.
  type StringMap<T> = { [key: string]: T };

  // Setup the shared sorting state.
  let sorted: string[] = [];
  let graph: StringMap<string[]> = Object.create(null);
  let visited: StringMap<boolean> = Object.create(null);

  // Add the edges to the graph.
  each(edges, addEdge);

  // Visit each node in the graph.
  Object.keys(graph).forEach(visit);

  // Return the sorted results.
  return sorted;

  // Add an edge to the graph.
  function addEdge(edge: [string, string]): void {
    let [fromNode, toNode] = edge;
    if (toNode in graph) {
      graph[toNode].push(fromNode);
    } else {
      graph[toNode] = [fromNode];
    }
  }

  // Recursively visit the node.
  function visit(node: string): void {
    if (node in visited) {
      return;
    }
    visited[node] = true;
    if (node in graph) {
      graph[node].forEach(visit);
    }
    sorted.push(node);
  }
}
