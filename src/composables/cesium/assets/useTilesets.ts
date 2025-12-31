// src/composables/cesium/assets/useTilesets.ts
import { ref } from 'vue';
import type { ShallowRef } from 'vue';
import type { Viewer, Resource } from 'cesium';
import { 
  Cesium3DTileset, 
  IonResource, 
  Resource as CesiumResource,
  HeadingPitchRange,
  Math as CesiumMath,
  Matrix4,
} from 'cesium';
import { useCesiumAssetCache } from '@/stores/cesiumAssetCache';
import { useAuth } from '@/composables/useAuth';

type TilesetUrl = string;
type AddTilesetOptions = {
  maximumScreenSpaceError?: number;
  show?: boolean;
  headers?: Record<string, string>;
  zoomTo?: boolean;
  // Camera positioning options
  heading?: number;      // degrees, 0 = north
  pitch?: number;        // degrees, negative = looking down
  distanceMultiplier?: number;  // multiplier for bounding sphere radius
};

/**
 * Check if URL is external storage (OVH S3, AWS, etc.) - shouldn't receive auth headers
 */
function isExternalStorageUrl(url: string): boolean {
  const externalPatterns = [
    'ovh.net',
    's3.gra.io.cloud.ovh.net',
    's3.gra.perf.cloud.ovh.net',
    's3.rbx.io.cloud.ovh.net',
    's3.sbg.io.cloud.ovh.net',
    'amazonaws.com',
    's3.amazonaws.com',
    'storage.googleapis.com',
    'blob.core.windows.net',
    'digitaloceanspaces.com',
  ];

  try {
    const urlObj = new URL(url);
    return externalPatterns.some(pattern => urlObj.hostname.includes(pattern));
  } catch {
    return false;
  }
}

export function useTilesets(viewerRef: ShallowRef<Viewer | null>) {
  const cache = useCesiumAssetCache();
  const { getToken } = useAuth();
  
  const tilesetLoading = ref(false);
  const tilesetError = ref<string | null>(null);

  function positionCameraForTileset(
    viewer: Viewer, 
    tileset: Cesium3DTileset,
    options: {
      heading?: number;
      pitch?: number;
      distanceMultiplier?: number;
    } = {}
  ) {
    const {
      heading = 0,
      pitch = -30,
      distanceMultiplier = 2.5, 
    } = options;

    const boundingSphere = tileset.boundingSphere;
    if (!boundingSphere) {
      console.warn('[useTilesets] No bounding sphere available for camera positioning');
      return;
    }

    const { center, radius } = boundingSphere;

    viewer.camera.lookAt(
      center,
      new HeadingPitchRange(
        CesiumMath.toRadians(heading),
        CesiumMath.toRadians(pitch),
        radius * distanceMultiplier
      )
    );

    viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  }

  const addTileset = async (
    url: TilesetUrl,
    options: AddTilesetOptions = {}
  ): Promise<Cesium3DTileset | null> => {
    const viewer = viewerRef.value;
    if (!viewer || viewer.isDestroyed()) return null;

    tilesetLoading.value = true;
    tilesetError.value = null;

    let tileset = cache.getCachedTileset(url);

    if (tileset) {
      if (tileset.isDestroyed()) {
        console.warn('[useTilesets] Cached tileset was destroyed — removing from cache:', url);
        cache.removeTileset(url);
        tileset = null;
      } else {
        if (!viewer.scene.primitives.contains(tileset)) {
          viewer.scene.primitives.add(tileset);
        }
        tileset.show = options.show ?? true;
        
        if (options.zoomTo !== false) {
          positionCameraForTileset(viewer, tileset, {
            heading: options.heading,
            pitch: options.pitch,
            distanceMultiplier: options.distanceMultiplier,
          });
        }
        
        viewer.scene.requestRender();
        tilesetLoading.value = false;
        return tileset;
      }
    }

    try {
      let resource: Resource | string;

      if (url.startsWith('ion:') || /^\d+$/.test(url.trim())) {
        const assetId = Number(url.replace('ion:', '').trim());
        resource = await IonResource.fromAssetId(assetId);
      }
      else if (isExternalStorageUrl(url)) {
        resource = new CesiumResource({ url });
        console.warn('[useTilesets] Loading external tileset (no auth):', url);
      }
      else if (options.headers) {
        resource = new CesiumResource({
          url,
          headers: options.headers,
        });
      }

      else {
        const token = await getToken();
        if (token) {
          resource = new CesiumResource({
            url,
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          resource = url;
        }
      }

      const newTileset = await Cesium3DTileset.fromUrl(resource, {
        maximumScreenSpaceError: options.maximumScreenSpaceError ?? 8,
        skipLevelOfDetail: true,
        dynamicScreenSpaceError: true,
      });

      viewer.scene.primitives.add(newTileset);
      newTileset.show = options.show ?? true;
      cache.cacheTileset(url, newTileset);

      if (options.zoomTo !== false) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        positionCameraForTileset(viewer, newTileset, {
          heading: options.heading,
          pitch: options.pitch,
          distanceMultiplier: options.distanceMultiplier,
        });
      }

      viewer.scene.requestRender();
      tilesetLoading.value = false;
      return newTileset;
    } catch (err: any) {
      console.error('[useTilesets] Failed to load tileset:', url, err);
      tilesetError.value = err?.message || 'Failed to load tileset';
      tilesetLoading.value = false;
      return null;
    }
  };

  const removeTilesetByUrl = (url: string) => {
    const viewer = viewerRef.value;
    if (!viewer) return;

    const tileset = cache.getCachedTileset(url);
    if (tileset && viewer.scene.primitives.contains(tileset)) {
      viewer.scene.primitives.remove(tileset);
      viewer.scene.requestRender();
    }
  };

  const removeTileset = (tileset: Cesium3DTileset) => {
    const viewer = viewerRef.value;
    if (viewer && viewer.scene.primitives.contains(tileset)) {
      viewer.scene.primitives.remove(tileset);
      viewer.scene.requestRender();
    }
  };

  const clearError = () => {
    tilesetError.value = null;
  };

  return {
    addTileset,
    removeTileset,
    removeTilesetByUrl,
    tilesetLoading,
    tilesetError,
    clearError,
    positionCameraForTileset,
  };
}