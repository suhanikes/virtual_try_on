import type { BufferGeometry, Mesh } from 'three';
import { BufferAttribute, InterleavedBufferAttribute } from 'three';

/**
 * MeshStandardMaterial aoMap reads UV2 in the fragment shader. Many GLBs use
 * InterleavedBufferAttribute for `uv`; calling `.clone()` on it does not always
 * produce a standalone BufferAttribute Three can bind, which leads to
 * "uv1 undeclared" / AOMAP_UV compile errors. This copies UVs into a real `uv2` channel.
 */
export function ensureMeshUv2ForAoMap(mesh: Mesh): void {
  const geometry = mesh.geometry as BufferGeometry | undefined;
  if (!geometry?.attributes) {
    return;
  }

  if (geometry.attributes.uv2) {
    return;
  }

  const uv = geometry.attributes.uv as BufferAttribute | InterleavedBufferAttribute | undefined;
  if (!uv) {
    return;
  }

  if (uv instanceof InterleavedBufferAttribute || (uv as { isInterleavedBufferAttribute?: boolean }).isInterleavedBufferAttribute) {
    const interleaved = uv as InterleavedBufferAttribute;
    const count = interleaved.count;
    const itemSize = interleaved.itemSize;
    const arr = new Float32Array(count * itemSize);
    for (let i = 0; i < count; i++) {
      if (itemSize >= 1) {
        arr[i * itemSize] = interleaved.getX(i);
      }
      if (itemSize >= 2) {
        arr[i * itemSize + 1] = interleaved.getY(i);
      }
      if (itemSize >= 3) {
        arr[i * itemSize + 2] = interleaved.getZ(i);
      }
      if (itemSize >= 4) {
        arr[i * itemSize + 3] = interleaved.getW(i);
      }
    }
    geometry.setAttribute('uv2', new BufferAttribute(arr, itemSize, interleaved.normalized));
    return;
  }

  const buf = uv as BufferAttribute;
  // Plain BufferAttribute: clone() is reliable; copy keeps a distinct GPU buffer for uv2.
  geometry.setAttribute('uv2', buf.clone());
}
