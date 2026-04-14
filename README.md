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
- Optional particle-particle collisions
- Particle trace histories
- Cell-based heat maps for density, mean speed, temperature proxy, and momentum magnitude
- Inferred local velocity arrows
- Optional coarse-grid overlay
- Interactive controls for particle count, inlet speed, jitter, trace length, and mesh size

## Purpose

The goal of this project is to explore whether a tractable number of explicitly simulated particles can reproduce useful macroscopic patterns through post-simulation aggregation into scalar and vector fields.

This includes examining:

- Density variation
- Velocity structure
- Momentum distribution
- Temperature-like fluctuation behavior
- Fine-grid versus coarse-grid interpretation

## Notes

This is not currently a replacement for ANSYS Fluent, OpenFOAM, or other high-fidelity CFD tools.

It is a particle-to-field educational simulator intended to help visualize how local motion rules and interaction assumptions can generate larger-scale structure.

## Planned Extensions

- Additional display modes
- More rigorous convergence diagnostics
- Pressure proxy estimation from wall momentum transfer
- Streamline integration from averaged velocity fields
- Benchmark comparisons against canonical transport cases
