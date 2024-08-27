import { Camera, Scene } from "three"

export type SceneHandle = {
  scene: () => Scene
  camera: () => Camera
}
