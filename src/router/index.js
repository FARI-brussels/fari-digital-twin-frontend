import { createRouter, createWebHistory } from 'vue-router';
import AssetLibrary from '../views/libraries/AssetLibrary.vue';
import MapLibrary from '../views/libraries/MapLibrary.vue';
import TilesetLibrary from '../views/libraries/TilesetLibrary.vue';
import DemoView from '../views/DemoView.vue';
import HomePage from "../views/HomePage.vue";
import LibraryLayout from "../components/LibraryLayout.vue";
import ApiDocView from "@/views/ApiDocView.vue";

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

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 