/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Topologically sort an array of edges.
 *
 * @param edges - The array of edges to sort. An edge is represented
 *   as a 2-tuple of the form `[fromNode, toNode]`.
 *
 * @returns The sorted array of nodes.
 *
 * #### Notes
 * If a cycle is present in the graph, the cycle will be ignored and
 * the return value will be only approximately sorted.
 */
export
function topSort(edges: Array<[string, string]>): string[] {
  // A type alias for an object hash.
  type StringMap<T> = { [key: string]: T };

  // Setup the shared sorting state.
  let sorted: string[] = [];
  let graph: StringMap<string[]> = Object.create(null);
  let visited: StringMap<boolean> = Object.create(null);

  // Add the edges to the graph.
  for (let [fromNode, toNode] of edges) {
    addEdge(fromNode, toNode);
  }

  // Visit each node in the graph.
  for (let node in graph) {
    visit(node);
  }

  // Return the sorted results.
  return sorted;

  // Add an edge to the graph.
  function addEdge(fromNode: string, toNode: string): void {
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
      for (let other of graph[node]) {
        visit(other);
      }
    }
    sorted.push(node);
  }
}
