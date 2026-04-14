# [Molecular Motion Simulation](https://robert-z-lehr.github.io/Molecular-Motion-Simulation/)

JavaScript browser-based molecular motion and particle-to-field simulation.

## Live Demo

**[Launch the simulation](https://robert-z-lehr.github.io/Molecular-Motion-Simulation/)**

## Overview

This project is a browser-based proof of concept for exploring how individual particle motion can produce emergent field-like behavior when aggregated over space and time.

The simulation is designed as an educational and exploratory tool rather than a validated CFD solver.

## Current Features

- Particle injection through an inlet
- Outlet removal
- Wall reflection
- Obstacle interaction
- Optional particle-particle collisions
- Particle trace histories
- Cell-based heat maps for density, mean speed, temperature proxy, and momentum magnitude
- Inferred local velocity arrows
- Optional coarse-grid overlay
- Interactive controls for particle count, inlet speed, jitter, trace length, and mesh size

## Notes

This is not currently a replacement for ANSYS Fluent, OpenFOAM, or other high-fidelity CFD tools.

It is a particle-to-field educational simulator intended to help visualize how local motion rules and interaction assumptions can generate larger-scale structure.
