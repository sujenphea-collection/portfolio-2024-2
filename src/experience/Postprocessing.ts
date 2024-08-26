import { Camera, Scene, Texture, WebGLRenderTarget } from "three"
import { FboHelper } from "./FBOHelper"
import { Pass } from "./Pass"

const tempRenderTarget = new WebGLRenderTarget()
const tempTexture = new Texture()
export class Postprocessing {
  queue: Pass[] = []

  // render targets
  sceneRenderTarget = tempRenderTarget

  fromRenderTarget = tempRenderTarget

  toRenderTarget = tempRenderTarget

  // textures
  fromTexture = tempTexture

  toTexture = tempTexture

  // uniforms
  sharedUniforms = {
    u_fromTexture: { value: null as Texture | null },
    u_toTexture: { value: null as Texture | null },
  }

  init() {
    // setup render targets
    this.fromRenderTarget = FboHelper.createRenderTarget(1, 1)
    this.toRenderTarget = this.fromRenderTarget.clone()
    this.sceneRenderTarget = this.fromRenderTarget.clone()

    // setup textures
    this.fromTexture = this.fromRenderTarget.texture
    this.toTexture = this.toRenderTarget.texture
  }

  resize(width: number, height: number) {
    this.fromRenderTarget.setSize(width, height)
    this.toRenderTarget.setSize(width, height)
    this.sceneRenderTarget.setSize(width, height)
  }

  dispose() {
    this.fromRenderTarget.dispose()
    this.toRenderTarget.dispose()
    this.sceneRenderTarget.dispose()
  }

  swap() {
    const e = this.fromRenderTarget
    this.fromRenderTarget = this.toRenderTarget
    this.toRenderTarget = e
    this.fromTexture = this.fromRenderTarget?.texture || null
    this.toTexture = this.toRenderTarget?.texture || null
    this.sharedUniforms.u_fromTexture.value = this.fromTexture
    this.sharedUniforms.u_toTexture.value = this.toTexture
  }

  /* --------------------------------- renders -------------------------------- */
  render(scene: Scene, camera: Camera) {
    const filteredQueue = this.queue
      .filter((q) => q.enabled)
      .sort((x: Pass, y: Pass) => {
        return x.renderOrder === y.renderOrder ? 0 : x.renderOrder - y.renderOrder
      })

    // before first pass
    if (filteredQueue.length) {
      FboHelper.gl.setRenderTarget(this.sceneRenderTarget)
    } else {
      FboHelper.gl.setRenderTarget(null)
    }

    // render scene
    FboHelper.gl.render(scene, camera)
    FboHelper.gl.autoClear = true

    // render passes
    if (filteredQueue.length > 0) {
      FboHelper.gl.setRenderTarget(null)
      FboHelper.copy(this.sceneRenderTarget.texture, camera, this.fromRenderTarget)

      const colorState = FboHelper.getColorState()
      FboHelper.gl.autoClear = !1

      filteredQueue.forEach((pass, i) => {
        const isLast = i === filteredQueue.length - 1

        pass.render(this.fromTexture, this.toRenderTarget, camera, isLast)

        this.swap()
      })

      FboHelper.setColorState(colorState)
    }
  }
}
