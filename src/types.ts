import * as THREE from 'three';

export interface SpatialObject extends THREE.Object3D {
    _boundingBox?: THREE.Box3;
}

/**
 * A Vector2 represented as an array of two numbers.
 *
 * ```ts
 * [x, y] = foo
 * ```
 */
export type Vector2 = [number, number];

/**
 * See {@link Vector2}
 */
export type Dimensions = Vector2;

/**
 *
 */
export type Bounds = [Vector2, Vector2];

/**
 * Cell Index
 */
export type CellIndex = Vector2;

/**
 *
 */
export type Client = {
    position: Vector2;
    dimensions: Dimensions;
    cells: Cells;
    _queryId: number;
    metadata: { [key: string]: string };
};
/**
 * Head of the doubly-linked list.
 */
export interface Head {
    next: Head | null;
    prev: Head | null;
    client: Client;
}
/**
 * A node from the doubly-linked list.
 */
export type Nodes = Head[][];
/**
 * Cell with references to the head node and cell indices.
 */
export interface Cells {
    min: CellIndex | null;
    max: CellIndex | null;
    nodes: Nodes | null;
}
