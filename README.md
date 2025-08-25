# FARI Digital Twin Asset Library

A web application for managing and visualizing 3D assets and geospatial data for a digital twin. This project provides a user-friendly interface to upload, browse, and view various types of digital twin assets. It is built with Vue 3 and Vite, and it uses libraries like Cesium and Three.js for powerful 2D/3D visualization.

## Features

- **Asset Management**: Upload, and manage various types of assets:
  - 3D Models (e.g., glTF)
  - 3D Tilesets (e.g., Cesium 3D Tiles)
  - Point Clouds
  - Geospatial Map Layers (WMS)
- **Interactive Viewers**: Each asset type has a dedicated interactive viewer:
  - A 3D model viewer.
  - A Cesium-based viewer for 3D tilesets and point clouds.
  - A 2D map viewer for WMS layers with legend support.
- **Organized Libraries**: Browse assets in dedicated libraries for maps, 3D tilesets, and point clouds.

## Tech Stack

- **Frontend**: [Vue 3](https://vuejs.org/) with `<script setup>` SFCs
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **3D/Geospatial Visualization**:
  - [CesiumJS](https://cesium.com/platform/cesiumjs/)
  - [Three.js](https://threejs.org/)
  - [Giro3D](https://giro3d.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## Project Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```sh
    git clone <repository-url>
    cd fari-digital-twin-asset-library
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Run the development server:**

    ```sh
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

4.  **Set backend url:**

    Create an `.env` (or `.env.local`) in the project root and set:

    ```env
    VITE_BACKEND_URL=https://your-backend.example.com
    ```

    The app reads this using `import.meta.env.VITE_BACKEND_URL`. Do not set this in `vite.config.js`.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Serves the production build locally to preview it.
