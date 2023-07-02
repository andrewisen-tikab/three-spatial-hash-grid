import { Bounds, CellIndex, Client, Dimensions, Head, Nodes, Vector2 } from './types';
import math from './math';

let cellIndexX = /* @__PURE__ */ 0;
let cellIndexY = /* @__PURE__ */ 0;

/**
 * A spatial hash is a 2 or 3 dimensional extension of the hash table.
 * The basic idea of a hash table is that you take a piece of data (the 'key'),
 * run it through some function (the 'hash function') to produce a new value (the 'hash'),
 * and then use the hash as an index into a set of slots ('cells').
 *
 * Or, in other words:
 * You can define you 2D world into a fixed grid, e.g 4x4.
 *
 * ```
 * +---+---+---+---+
 * | a | b | c | d |
 * +---+---+---+---+
 * | e | f | g | h |
 * +---+---+---+---+
 * | i | j | k | l |
 * +---+---+---+---+
 * | m | n | o | p |
 * +---+---+---+---+
 * ```
 *
 * If you place an object into the world, it would fall into a least one of these cells.
 *
 * For example, let's put an object `X` at cell `g`.
 *
 * ```
 * +---+---+---+---+
 * | a | b | c | d |
 * +---+---+---+---+
 * | e | f | X | h |
 * +---+---+---+---+
 * | i | j | k | l |
 * +---+---+---+---+
 * | m | n | o | p |
 * +---+---+---+---+
 * ```
 *
 * If we want to look for objects nearby, we simply check the nearby cells.
 *
 * ```
 * +---+---+---+---+
 * |   |   | c |   |
 * +---+---+---+---+
 * |   | f | X | h |
 * +---+---+---+---+
 * |   |   | k |   |
 * +---+---+---+---+
 * |   |   |   |   |
 * +---+---+---+---+
 * ```
 *
 * In this example, we ignore the diagonally neighbors.
 *
 * In other words: This is just like [Minesweeper](https://en.wikipedia.org/wiki/Minesweeper_(video_game))
 *
 * ```
 * +---+---+---+---+
 * | ? | ? | ? | ? |
 * +---+---+---+---+
 * | ? | ? | X | ? |
 * +---+---+---+---+
 * | ? | ? | ? | ? |
 * +---+---+---+---+
 * | ? | ? | ? | ? |
 * +---+---+---+---+
 * ```
 *
 * See: [https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
 *
 * @author André Wisén
 * @copyright MIT
 */
export default class SpatialHashGrid {
    /**
     * A doubly-linked list containing a two-dimensional array of nodes.
     * Each node corresponds to a cell.
     *
     * See: [https://medium.com/front-end-weekly/data-structures-linked-list-implementation-in-js-3beb48ff49cd](https://medium.com/front-end-weekly/data-structures-linked-list-implementation-in-js-3beb48ff49cd)
     */
    private cells: Nodes;

    /**
     * How many cells along each dimensional axis.
     *
     * For example:
     * If the world is 100 units wide and we have 5 cells,
     * then each cell will span 100/5=20 units.
     */
    private dimensions: Dimensions;

    /**
     * The `min` and `max` the grid will operate on.
     */
    private bounds: Bounds;

    /**
     * Used to deduplicate clients in {@link SpatialHashGrid.findNear}.
     */
    private queryIds: number;

    /**
     * Create a `SpatialHashGrid` object using a fixed sized grid.
     * @param bounds The min/max the grid will operate on. I.e. if the world goes from `-1000, -1000` to `1000, 1000`, then this should be `[-1000, -1000], [1000, 1000]`.
     * @param dimensions How **many** cells along each dimensional axis. I.e. if the world is 100 units wide and we have 5 cells, then each cell will span `100/5=20 units`.
     */
    constructor(bounds: Bounds, dimensions: Dimensions) {
        const [x, y] = dimensions;

        // Doubled linked list.
        this.cells = [...Array(x)].map((_) => [...Array(y)].map((_) => null)) as unknown as Nodes;

        this.dimensions = dimensions;
        this.bounds = bounds;
        this.queryIds = 0;
    }

    /**
     * "What cell index is this point in?"
     *
     * In other words: Perform a lookup.
     * @param position
     * @returns
     */
    private getCellIndex(position: CellIndex): CellIndex {
        cellIndexX = math.sat(
            (position[0] - this.bounds[0][0]) / (this.bounds[1][0] - this.bounds[0][0]),
        );
        cellIndexY = math.sat(
            (position[1] - this.bounds[0][1]) / (this.bounds[1][1] - this.bounds[0][1]),
        );

        return [
            // X index
            Math.floor(cellIndexX * (this.dimensions[0] - 1)),
            // Y index
            Math.floor(cellIndexY * (this.dimensions[1] - 1)),
        ];
    }

    /**
     * Create a new client
     * @param position Initial position of the client.
     * @param dimensions With and height of the client.
     * @returns
     */
    protected newClient(position: CellIndex, dimensions: Dimensions, metadata = {}): Client {
        const client: Client = {
            position,
            dimensions,
            cells: {
                min: null, // Index
                max: null, // Index
                nodes: null, // Access the doubly-linked list node
            },
            _queryId: -1,
            metadata,
        };
        this.insert(client);

        return client;
    }

    /**
     * Update client.
     */
    protected updateClient(client: Client): void {
        const {
            position: [x, y],
            dimensions: [w, h],
            cells,
        } = client;

        if (cells === null) throw new Error('Client has no cells.');
        const { min, max } = cells;
        if (min === null || max === null) throw new Error('Client has no min/max cells.');

        const i1 = this.getCellIndex([x - w / 2, y - h / 2]);
        const i2 = this.getCellIndex([x + w / 2, y + h / 2]);

        // Expect temporal coherence between frames/updates.
        if (min[0] === i1[0] && min[1] === i1[1] && max[0] === i2[0] && max[1] === i2[1]) return;

        // If not, then update the client by removing it and adding it again.
        this.remove(client);
        this.insert(client);
    }

    /**
     * Find nearby clients.
     * @param position
     * @param bounds
     * @returns
     */
    protected findNear(position: Vector2, bounds: Vector2): Client[] {
        const [x, y] = position;
        const [w, h] = bounds;

        const i1 = this.getCellIndex([x - w / 2, y - h / 2]);
        const i2 = this.getCellIndex([x + w / 2, y + h / 2]);

        const clients: Client[] = [];

        /**
         * Create a unique id.
         *
         * In other words:
         * Remove any duplicates.
         *
         * For example, if a client is "large" and takes up many cells.
         */
        const queryId = this.queryIds++;

        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                // Head node of the doubly-linked list.
                let head = this.cells[x][y];
                while (head) {
                    const v = head.client;
                    head = head.next!;
                    // If true, then we have already dealt with this client.
                    if (v._queryId === queryId) continue;
                    v._queryId = queryId;
                    clients.push(v);
                }
            }
        }
        return clients;
    }

    /**
     * Using the `position` and `size` of the client,
     * loop over the cells that the client touches.
     *
     * If the client touches a cell, then insert the client into it.
     * @param client
     */
    private insert(client: Client) {
        // Destruct data.
        const {
            position: [x, y],
            dimensions: [w, h],
        } = client;

        // Calculate the min and max range of the cells.
        const i1 = this.getCellIndex(
            // Subtract half the width and hight
            [x - w / 2, y - h / 2],
        );
        const i2 = this.getCellIndex(
            // Add half the width and hight
            [x + w / 2, y + h / 2],
        );

        // Track nodes of the doubly-linked list.
        const nodes: Nodes = [];

        // Iterate in both dimension
        for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
            // Push an empty array. I.e. making two dimensional.
            nodes.push([]);
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = x - i1[0];
                // Node in the doubly-linked list.
                const head: Head = {
                    next: null,
                    prev: null,
                    client,
                };
                nodes[xi].push(head);
                head.next = this.cells[x][y];
                if (this.cells[x][y]) {
                    this.cells[x][y].prev = head;
                }
                this.cells[x][y] = head;
            }
        }
        client.cells.min = i1;
        client.cells.max = i2;
        client.cells.nodes = nodes;
    }

    /**
     * Remove client from the grid.
     * @param client
     */
    protected remove(client: Client): void {
        const { cells } = client;
        if (cells === null) throw new Error('Client has no cells.');
        const { min: i1, max: i2, nodes } = cells;
        if (i1 === null || i2 === null) throw new Error('Client has no min or max.');
        if (nodes === null) throw new Error('Client has no nodes.');

        for (let [_x] = i1, [xn] = i2; _x <= xn; ++_x) {
            // eslint-disable-next-line prefer-destructuring
            for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
                const xi = _x - i1[0];
                const yi = y - i1[1];

                // Reference to the doubly-linked list list node.
                const node = nodes[xi][yi];

                // Just swap the nodes.
                if (node.next) {
                    node.next.prev = node.prev;
                }
                // Just swap the nodes.
                if (node.prev) {
                    node.prev.next = node.next;
                }

                // If you delete the head node, simply point to the next node.
                if (!node.prev) {
                    this.cells[_x][y] = node.next!;
                }
            }
        }
        client.cells.min = null;
        client.cells.max = null;
        client.cells.nodes = null;
    }
}
