// Augments JSX with @react-three/fiber intrinsic elements (mesh, group, etc.)
// React Three Fiber declares these via module augmentation; we re-augment here
// because our tsconfig restricts the global `types` array.
import type { ThreeElements } from '@react-three/fiber';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {};
