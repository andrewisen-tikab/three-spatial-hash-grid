import * as THREE from 'three';
import { Bounds, Client, Dimensions, SpatialObject, Vector2 } from './types';
import SpatialHashGrid from './SpatialHashGrid';
import { GridHelper } from './GridHelper';

const _position = /* @__PURE__ */ new THREE.Vector3();
let _client: Client; /* @__PURE__ */

/**
 * A spatial hash is a 2 or 3 dimensional extension of the hash table.
 * The basic idea of a hash table is that you take a piece of data (the 'key'),
 * run it through some function (the 'hash function') to produce a new value (the 'hash'),
 * and then use the hash as an index into a set of slots ('cells').
 *
 * @author André Wisén
 * @copyright MIT
 */
export default class ThreeSpatialHashGrid extends SpatialHashGrid {
    /**
     * {@link Client | Clients} in the grid.
     */
    public readonly clients: Client[];

    /**
     * Add the group to the scene if you want to display debug information.
     */
    public readonly group: THREE.Group;

    /**
     * Create a `SpatialHashGrid` object using a fixed sized grid.
     * @param bounds The min/max the grid will operate on. I.e. if the world goes from `-1000, -1000` to `1000, 1000`, then this should be `[-1000, -1000], [1000, 1000]`.
     * @param dimensions How **many** cells along each dimensional axis. I.e. if the world is 100 units wide and we have 5 cells, then each cell will span `100/5=20 units`.
     */
    constructor(bounds: Bounds, dimensions: Dimensions, debug: boolean = false) {
        super(bounds, dimensions);
        this.clients = [];
        this.group = new THREE.Group();
        if (debug) this.debug(bounds);
    }

    /**
     * Create a {@link THREE.GridHelper | GridHelper} to display the grid.
     * @param bounds The min/max the grid will operate on. I.e. if the world goes from `-1000, -1000` to `1000, 1000`, then this should be `[-1000, -1000], [1000, 1000]`.
     */
    private debug(bounds: Bounds) {
        const x = bounds[1][0] - bounds[0][0];
        const y = bounds[1][1] - bounds[0][1];
        const gridHelper = new GridHelper(x, y);

        this.group.add(gridHelper);
    }

    /**
     * Add a `Model3D` to the spatial has grid.
     * @param object
     */
    public add(object: SpatialObject): void {
        // TODO: Switch to world position.
        // object.getWorldPosition(_position);
        _position.copy(object.position);

        const { _boundingBox } = object;
        if (_boundingBox == null) {
            object._boundingBox = this.calculateBoundingBox(object);
        }

        const { min, max } = object._boundingBox!;
        const client = this.newClient([_position.x, _position.z], [max.x - min.x, max.z - min.z], {
            object,
        });

        this.clients.push(client);
    }

    /**
     * Calculate the bounding box of the object.
     * @param object
     */
    private calculateBoundingBox(object: THREE.Object3D): THREE.Box3 {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
            const { geometry } = mesh;
            geometry.computeBoundingBox();
            const { boundingBox } = geometry;
            if (boundingBox == null) throw new Error('Failed to compute bounding box');
            return boundingBox;
        } else {
            throw new Error('Not implemented');
        }
    }

    /**
     * Get nearby objects.
     * @param position World position of the lookup.
     * @param bounds Bounds of the lookup
     * @returns Array of nearby clients (!). Not objects.
     */
    public getNearbyObjects(position: THREE.Vector3, bounds: Vector2) {
        return this.findNear([position.x, position.z], bounds);
    }

    /**
     * Update all clients.
     */
    public update() {
        for (let i = 0; i < this.clients.length; i++) {
            _client = this.clients[i];
            // Update position. Assume world position.
            _client.position = [
                (_client.metadata.object as any).position.x,
                (_client.metadata.object as any).position.y,
            ];
            // TODO: Update dimensions.
            // _client.dimensions = _client.dimensions;
            this.updateClient(_client);
        }
    }

    /**
     * Dispose of the grid.
     */
    public dispose() {
        this.group.clear();
        for (let i = 0; i < this.clients.length; i++) {
            const client = this.clients[i];
            this.remove(client);
            this.clients.splice(i, 1);
        }
    }
}
