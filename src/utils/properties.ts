import { WebGLRenderer } from "three"

export class Properties {
  static viewportWidth = 0

  static viewportHeight = 0

  // time
  static time = 0

  static deltaTime = 0

  // gl
  static gl: WebGLRenderer
}
