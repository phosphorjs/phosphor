/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, each
} from './iter';


/**
 * Topologically sort an iterable of edges.
 *
 * @param edges - The iterable or array-like object of edges to sort.
 *   An edge is represented as a 2-tuple of `[fromNode, toNode]`.
 *
 * @returns The topologically sorted array of nodes.
 *
 * #### Notes
 * If a cycle is present in the graph, the cycle will be ignored and
 * the return value will be only approximately sorted.
 *
 * #### Example
 * ```typescript
 * import { topologicSort } from '@phosphor/algorithm';
 *
 * let data = [
 *   ['d', 'e'],
 *   ['c', 'd'],
 *   ['a', 'b'],
 *   ['b', 'c']
 * ];
 *
 * topologicSort(data);  // ['a', 'b', 'c', 'd', 'e']
 */
export
function topologicSort<T>(edges: IterableOrArrayLike<[T, T]>): T[] {
  // Setup the shared sorting state.
  let sorted: T[] = [];
  let visited = new Set<T>();
  let graph = new Map<T, T[]>();

  // Add the edges to the graph.
  each(edges, addEdge);

  // Visit each node in the graph.
  graph.forEach((v, k) => { visit(k); });

  // Return the sorted results.
  return sorted;

  // Add an edge to the graph.
  function addEdge(edge: [T, T]): void {
    let [fromNode, toNode] = edge;
    let children = graph.get(toNode);
    if (children) {
      children.push(fromNode);
    } else {
      graph.set(toNode, [fromNode]);
    }
  }

  // Recursively visit the node.
  function visit(node: T): void {
    if (visited.has(node)) {
      return;
    }
    visited.add(node);
    let children = graph.get(node);
    if (children) {
      children.forEach(visit);
    }
    sorted.push(node);
  }
}
