import './style.css';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import ThreeSpatialHashGrid from '../src/ThreeSpatialHashGrid';
import { Bounds } from '../src/types';

import CameraControls from 'camera-controls';

CameraControls.install({ THREE: THREE });

/**
 * Example of how to use the `ThreeSpatialHashGrid` class.
 */
const example = (): void => {
    // Setup scoped variables
    let spatialHashGrid: ThreeSpatialHashGrid;
    let cameraControls: CameraControls;
    let scene: THREE.Scene;
    let group: THREE.Group;
    let renderer: THREE.WebGLRenderer;
    let positionHelper: THREE.Mesh;

    // Setup the GUI
    const gui = new GUI();
    const configFolder = gui.addFolder('Config');
    let checkFolder: GUI;

    const params = {
        boundsX: 8,
        boundsZ: 8,
        cellSizeX: 1,
        cellSizeZ: 1,
        cubeSize: 1,
        numOfCubes: 1,
        x: 0,
        z: 0,
        status: 'N/A',
        log: () => {},
    };

    // Setup Stats.js
    const stats = new Stats();
    document.body.appendChild(stats.dom);

    /**
     * Initialize a basic three.js scene with all the bells and whistles.
     */
    const init = () => {
        // Setup a basic three.js scene
        scene = new THREE.Scene();
        group = new THREE.Group();
        scene.add(group);
        renderer = new THREE.WebGLRenderer({ antialias: true });

        const bgColor = new THREE.Color(0x263238);
        renderer.setClearColor(bgColor, 1);

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // We'll use the `camera-controls` library to handle our camera.
        const clock = new THREE.Clock();
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            1000,
        );

        cameraControls = new CameraControls(camera, renderer.domElement);

        // Setup a basic lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.position.set(10, 10, 10);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xb0bec5, 0.8));

        // Setup a positional helper
        const planeGeometry = new THREE.PlaneGeometry(params.cellSizeX, params.cellSizeZ);
        planeGeometry.translate(params.cellSizeX / 2, -params.cellSizeX / 2, 0);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            depthTest: false,
            depthWrite: false,
        });

        positionHelper = new THREE.Mesh(planeGeometry, planeMaterial);
        positionHelper.renderOrder = 1;
        positionHelper.rotateX(-Math.PI / 2);
        positionHelper.matrixAutoUpdate = false;
        positionHelper.updateMatrix();
        scene.add(positionHelper);

        const onWindowResize = (): void => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', onWindowResize);

        const render = (): void => {
            renderer.render(scene, camera);
        };

        const animate = (): void => {
            const delta = clock.getDelta();
            cameraControls.update(delta);
            requestAnimationFrame(animate);
            stats.update();
            render();
        };

        // Everything is setup, lets go!
        animate();
    };

    /**
     * Perform a simple check to see if the given position is near any objects in the grid.
     */
    const check = () => {
        const { x, z } = params;
        const result = spatialHashGrid.getNearbyObjects(new THREE.Vector3(x, 0, z), [
            params.cellSizeX,
            params.cellSizeZ,
        ]);
        params.status = result.length ? 'Near' : 'Not near';
        positionHelper.position.set(x, 0, z);
        positionHelper.updateMatrix();
    };

    /**
     * Create a new spatial hash grid based on the provided {@link params}, and add it to the scene.
     */
    const createSpatialHashGrid = (): void => {
        // Deconstruct the params object
        const { boundsX, boundsZ, cellSizeX, cellSizeZ, cubeSize } = params;

        // Calculate the grid helper size and divisions
        const gridHelperSize = Math.min(boundsX, boundsZ);
        const gridHelperDivisions = gridHelperSize / Math.min(cellSizeX, cellSizeZ);
        const deltaXHalf = boundsX / 2;
        const deltaZHalf = boundsZ / 2;

        // if ((gridHelperSize / params.cellSizeX) % 2 !== 0)
        //     throw new Error('gridHelperSize / params.cellSizeX must be even');

        // Clear everything and re-add the grid.
        group.clear();

        // Setup bounds
        const bounds: Bounds = [
            [-boundsX / 2, -boundsZ / 2],
            [boundsX / 2, boundsZ / 2],
        ];

        spatialHashGrid = new ThreeSpatialHashGrid(
            bounds,
            [gridHelperDivisions, gridHelperDivisions],
            true,
        );
        group.add(spatialHashGrid.group);

        // Create N cubes and add them to the grid
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize * 2, cubeSize);
        cubeGeometry.translate(cubeSize / 2, 0, cubeSize / 2);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

        for (let i = 0; i < params.numOfCubes; i++) {
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

            cube.position.x = Math.floor(Math.random() * gridHelperSize);
            cube.position.y = (cubeSize * 2) / 2;
            cube.position.z = Math.floor(Math.random() * gridHelperSize);

            // TODO: Fix
            // cube.matrixAutoUpdate = false;
            cube.updateMatrix();
            cube.updateMatrixWorld();

            group.add(cube);
            spatialHashGrid.add(cube);
        }

        // Everything ok, lets update the camera position
        cameraControls.setPosition(0, gridHelperSize * 2, gridHelperSize * 2, true);

        // Create 1x1 grid
        const gridHelper = new THREE.GridHelper(gridHelperSize, gridHelperSize, 0xffffff, 0xffffff);
        gridHelper.position.x = deltaXHalf;
        gridHelper.position.z = deltaZHalf;
        const material = gridHelper.material as THREE.Material;
        material.opacity = 0.2;
        material.transparent = true;
        group.add(gridHelper);

        // Create axes
        const axesHelper = new THREE.AxesHelper(boundsX * 2);
        axesHelper.setColors(
            new THREE.Color(0xff0000),
            new THREE.Color(0x00ff00),
            new THREE.Color(0x0000ff),
        );
        group.add(axesHelper);

        // Create GUI
        if (checkFolder) checkFolder.destroy();
        checkFolder = gui.addFolder('Check');

        checkFolder
            .add(params, 'x', 0, params.boundsX - params.cellSizeX, params.cellSizeX)
            .onChange(check);
        checkFolder
            .add(params, 'z', 0, params.boundsZ - params.cellSizeZ, params.cellSizeX)
            .onChange(check);
        checkFolder.add(params, 'status').listen().disable();
        checkFolder.add(params, 'log');
        params.log = () => {
            spatialHashGrid.clients.forEach((client) => {
                console.log(client);
            });
        };

        // Everything ok, lets check the initial position
        check();
    };

    // Functions are  created, let's call them!
    init();
    createSpatialHashGrid();

    // Finally, setup the GUI
    configFolder
        .add(params, 'boundsX', 1, 1_000, 1)
        .name('Bounds, X')
        .onChange((value: number) => {
            params.boundsZ = value;
            createSpatialHashGrid();
        });
    configFolder.add(params, 'boundsZ', 1, 1_000, 1).name('Bounds, Z').disable().listen();
    configFolder
        .add(params, 'cellSizeX', 1, 10, 1)
        .name('Cell size, X')
        .onChange((value: number) => {
            params.cellSizeZ = value;
            createSpatialHashGrid();
        });
    configFolder.add(params, 'cellSizeZ', 1, 10, 1).name('Cell size, Z').disable().listen();
    configFolder
        .add(params, 'cubeSize', 1, 10, 1)
        .name('Cube size (radius)')
        .onChange(createSpatialHashGrid);

    configFolder
        .add(params, 'numOfCubes', 1, 100_000, 1)
        .name('Number of cubes')
        .onChange(createSpatialHashGrid);
};

// Crate a new example and run it
example();
