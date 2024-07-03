// /mnt/data/WeightedGraph.js
import PriorityQueue from "./PriorityQueue";

export default class WeightedGraph {
  constructor() {
    this.adjacencyList = {};
    this.distances = {};
    this.previous = {};
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }

  addEdge(vertex1, vertex2, weight) {
    if (!this.adjacencyList[vertex1]) this.addVertex(vertex1);
    this.adjacencyList[vertex1].push({ node: vertex2, weight });
    this.calculateShortestPaths();
  }

  removeEdge(vertex1, vertex2) {
    if (this.adjacencyList[vertex1]) {
      this.adjacencyList[vertex1] = this.adjacencyList[vertex1].filter(
          v => v.node !== vertex2
      );
    }
    this.calculateShortestPaths();
  }

  removeVertex(vertex) {
    while (this.adjacencyList[vertex]) {
      const adjacentVertex = this.adjacencyList[vertex].pop();
      this.removeEdge(adjacentVertex.node, vertex);
    }
    delete this.adjacencyList[vertex];
    this.calculateShortestPaths();
  }

  calculateShortestPaths() {
    // Dijkstra algorithm implementation for all vertices
    const vertices = Object.keys(this.adjacencyList);
    vertices.forEach(vertex => {
      this.distances[vertex] = {};
      this.previous[vertex] = {};
      const nodes = new PriorityQueue();
      nodes.enqueue(vertex, 0);
      const distances = {};
      const previous = {};
      distances[vertex] = 0;

      for (let v of vertices) {
        if (v !== vertex) distances[v] = Infinity;
        previous[v] = null;
      }

      while (nodes.values.length) {
        let smallest = nodes.dequeue().val;
        if (smallest || distances[smallest] !== Infinity) {
          for (let neighbor of this.adjacencyList[smallest]) {
            let candidate = distances[smallest] + neighbor.weight;
            let nextNeighbor = neighbor.node;
            if (candidate < distances[nextNeighbor]) {
              distances[nextNeighbor] = candidate;
              previous[nextNeighbor] = smallest;
              nodes.enqueue(nextNeighbor, candidate);
            }
          }
        }
      }
      this.distances[vertex] = distances;
      this.previous[vertex] = previous;
    });
  }

  getShortestPath(start, finish) {
    let path = [];
    let smallest = finish;

    while (this.previous[start][smallest]) {
      path.push(smallest);
      smallest = this.previous[start][smallest];
    }

    if (path.length === 0) return null;
    return path.concat(smallest).reverse();
  }
}
