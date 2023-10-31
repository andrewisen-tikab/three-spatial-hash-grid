import * as THREE from 'three';

/**
 * The GridHelper is an object to define grids. Grids are two-dimensional arrays of lines.
 * This a custom implementation of the [THREE.GridHelper](https://threejs.org/docs/#api/en/helpers/GridHelper) class
 * with support for varying X and Y grid sizes.
 *
 * The gird is defined as a 2D plane with the origin at the center of the grid.
 * X and Y grid sizes are defined in the constructor and can be updated using the `update` method.
 */
export class GridHelper extends THREE.Object3D {
    protected _group: THREE.Group;

    protected _disposableObjects: THREE.BufferGeometry[];

    public material: THREE.LineBasicMaterial;

    /**
     * Generate a grid.
     * @param gridSizeX The size of the grid in the X direction (2D).
     * @param gridSizeY The size of the grid in the Y direction (2D).
     * @param gridSpacing The spacing between grid lines.
     */
    constructor(gridSizeX: number = 1, gridSizeY: number = 1, gridSpacing: number = 1) {
        super();
        this._group = new THREE.Group();
        this._disposableObjects = [];
        this.material = new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false });

        this.add(this._group);
        this.update(gridSizeX, gridSizeY, gridSpacing);
    }

    /**
     * Update the grid.
     * @param gridSizeX The size of the grid in the X direction (2D).
     * @param gridSizeY The size of the grid in the Y direction (2D).
     * @param gridSpacing The spacing between grid lines.
     */
    public update(gridSizeX: number = 1, gridSizeY: number = 1, gridSpacing: number = 1): void {
        this._group.clear();
        this._disposableObjects.forEach((object) => object.dispose());
        this._disposableObjects = [];

        // Create horizontal lines
        const horizontalVertices = [];
        for (let i = -gridSizeY / 2; i <= gridSizeY / 2; i += gridSpacing) {
            horizontalVertices.push(-gridSizeX / 2, 0, i);
            horizontalVertices.push(gridSizeX / 2, 0, i);
        }
        const horizontalGeometry = new THREE.BufferGeometry();
        horizontalGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(horizontalVertices, 3),
        );
        this._disposableObjects.push(horizontalGeometry);
        const horizontalLine = new THREE.LineSegments(horizontalGeometry, this.material);
        this._group.add(horizontalLine);

        // Create vertical lines
        const verticalVertices = [];
        for (let i = -gridSizeX / 2; i <= gridSizeX / 2; i += gridSpacing) {
            verticalVertices.push(i, 0, -gridSizeY / 2);
            verticalVertices.push(i, 0, gridSizeY / 2);
        }
        const verticalGeometry = new THREE.BufferGeometry();
        verticalGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(verticalVertices, 3),
        );
        this._disposableObjects.push(verticalGeometry);
        const verticalLine = new THREE.LineSegments(verticalGeometry, this.material);
        this._group.add(verticalLine);

        // Adjust position
        this._group.translateX(gridSizeX / 2);
        this._group.translateY(0.1);
        this._group.translateZ(gridSizeY / 2);
    }
}
