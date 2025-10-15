import { createRouter, createWebHistory } from 'vue-router';
import AssetLibrary from '../views/libraries/AssetLibrary.vue';
import MapLibrary from '../views/libraries/MapLibrary.vue';
import TilesetLibrary from '../views/libraries/TilesetLibrary.vue';
import DemoView from '../views/DemoView.vue';
import HomePage from "../views/HomePage.vue";
import LibraryLayout from "../components/LibraryLayout.vue";
import ApiDocView from "@/views/ApiDocView.vue";
import RealtimeViewer from "@/components/RealtimeViewer.vue";

const rawCallbackPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
const callbackPath = !rawCallbackPath || rawCallbackPath === '/'
  ? ''
  : rawCallbackPath.startsWith('/')
    ? rawCallbackPath
    : `/${rawCallbackPath}`;

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/doc', name: 'API Documentation', component: ApiDocView },

    {
        path: '/library',
        component: LibraryLayout,
        children: [
            {
                path: 'assets',
                name: 'AssetLibrary',
                component: AssetLibrary,
            },
            {
                path: 'maps',
                name: 'MapLibrary',
                component: MapLibrary,
            },
            {
                path: 'tilesets',
                name: 'TilesetLibrary',
                component: TilesetLibrary,
            },
            {
                path: 'realtime',
                name: 'RealtimeViewer.vue',
                component: RealtimeViewer,
            },
            {
                path: 'demo',
                name: 'Demo',
                component: DemoView,
            },
            {
                path: '',
                redirect: { name: 'AssetLibrary' }
            }
        ]
    }
];

if (callbackPath) {
    routes.push({
        path: callbackPath,
        name: 'AuthCallback',
        component: () => import('../views/AuthCallback.vue'),
    });
}

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router; 
