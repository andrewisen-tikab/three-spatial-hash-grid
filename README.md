# three-spatial-hash-grid

`three-spacial-hash-grid` is a two-dimensional (!) spatial hash grid for [three.js](https://threejs.org/).
Heavily inspired by:

-   ["Spatial Hash Grids & Tales from Game Development"](https://www.youtube.com/watch?v=sx4IIQL0x7c)
-   ["How I Optimized My JavaScript Project (Complete Walkthrough) | Faster Spatial Hash Grids"](https://www.youtube.com/watch?v=oewDaISQpw0)

[![PR Checker](https://github.com/andrewisen-tikab/three-spatial-hash-grid/actions/workflows/pr.yml/badge.svg)](https://github.com/andrewisen-tikab/three-spatial-hash-grid/actions/workflows/pr.yml)

[![Release](https://github.com/andrewisen-tikab/three-spatial-hash-grid/actions/workflows/release.yml/badge.svg)](https://github.com/andrewisen-tikab/three-spatial-hash-grid/actions/workflows/release.yml)

## Example

[https://andrewisen-tikab.github.io/three-spatial-hash-grid/example/](https://andrewisen-tikab.github.io/three-spatial-hash-grid/example/)

## Usage

Setup at scene in three.js and add the grid to the scene.

```ts
import  from 'three-spatial-hash-grid';

const grid = new (bounds, dimensions);
scene.add(spatialHashGrid.group);
```

## Config

> Bounds

The min/max the grid will operate on. I.e. if the world goes from `-1000, -1000` to `1000, 1000`, then this should be `[-1000, -1000], [1000, 1000]`.

> dimensions

How **many** cells along each dimensional axis. I.e. if the world is 100 units wide and we have 5 cells, then each cell will span `100/5=20 units`.

## Docs

Auto-generated docs can be found here:

[https://andrewisen-tikab.github.io/three-spatial-hash-grid/docs/](https://andrewisen-tikab.github.io/three-spatial-hash-grid/docs/)

## Remarks

Please note that this is a two-dimensional grid. +Y is up and Z is used for the depth of the grid.
See the example and look at the `axesHelper` for more information.

## Status

This is a work in progress. It is not yet ready for production.

## Spatial Hash Grid

A spatial hash is a 2 or 3 dimensional extension of the hash table.
The basic idea of a hash table is that you take a piece of data (the 'key'),
run it through some function (the 'hash function') to produce a new value (the 'hash'),
and then use the hash as an index into a set of slots ('cells').

Or, in other words:
You can define you 2D world into a fixed grid, e.g 4x4.

```
+---+---+---+---+
| a | b | c | d |
+---+---+---+---+
| e | f | g | h |
+---+---+---+---+
| i | j | k | l |
+---+---+---+---+
| m | n | o | p |
+---+---+---+---+
```

If you place an object into the world, it would fall into a least one of these cells.

For example, let's put an object `X` at cell `g`.

```
+---+---+---+---+
| a | b | c | d |
+---+---+---+---+
| e | f | X | h |
+---+---+---+---+
| i | j | k | l |
+---+---+---+---+
| m | n | o | p |
+---+---+---+---+
```

If we want to look for objects nearby, we simply check the nearby cells.

```
+---+---+---+---+
|   |   | c |   |
+---+---+---+---+
|   | f | X | h |
+---+---+---+---+
|   |   | k |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
```

In this example, we ignore the diagonally neighbors.

In other words: This is just like [Minesweeper](<https://en.wikipedia.org/wiki/Minesweeper_(video_game)>)

```
+---+---+---+---+
| ? | ? | ? | ? |
+---+---+---+---+
| ? | ? | X | ? |
+---+---+---+---+
| ? | ? | ? | ? |
+---+---+---+---+
| ? | ? | ? | ? |
+---+---+---+---+
```

See: [https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
