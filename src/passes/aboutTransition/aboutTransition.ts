import { Camera, Scene, Texture, WebGLRenderTarget } from "three"
import { FboHelper } from "../../experience/FBOHelper"
import { Pass } from "../../experience/Pass"
import { Properties } from "../../utils/properties"
import fragmentShader from "./aboutTransitionFrag.glsl"

export class AboutTransition extends Pass {
  toRT?: WebGLRenderTarget

  toRenderScene?: Scene

  toRenderCamera?: Camera

  reverse = false

  init(toRenderScene?: Scene, toRenderCamera?: Camera) {
    this.toRT = FboHelper.createRenderTarget(1, 1)
    this.toRenderScene = toRenderScene
    this.toRenderCamera = toRenderCamera

    this.material = FboHelper.createRawShaderMaterial({
      uniforms: {
        u_texture: { value: null },
        u_toScene: { value: null },
        u_progress: { value: 0 },
        u_time: Properties.globalUniforms.u_time,
      },
      fragmentShader,
    })
  }

  resize(width: number, height: number) {
    this.toRT?.setSize(width, height)

    super.resize(width, height)
  }

  render(texture: Texture, renderTarget: WebGLRenderTarget, camera: Camera, renderToScreen = !1) {
    const originalRt = FboHelper.gl.getRenderTarget()

    // clear RT
    if (this.toRT) {
      FboHelper.gl.setRenderTarget(this.toRT)
      FboHelper.gl.clear(true, true, true)
    }

    // render final scene into RT
    if (this.toRenderScene && this.toRenderCamera) {
      FboHelper.gl.setClearColor(0, 0)
      FboHelper.gl.render(this.toRenderScene, this.toRenderCamera)
    }

    // render transition into screen
    if (this.material) {
      if (!this.reverse) {
        this.material.uniforms.u_toScene.value = texture
        this.material.uniforms.u_texture.value = this.toRT?.texture // should be the world
      } else {
        this.material.uniforms.u_toScene.value = this.toRT?.texture
        this.material.uniforms.u_texture.value = texture
      }

      FboHelper.render(this.material, camera, renderToScreen ? null : renderTarget)
    }

    // post update - reset RT
    if (this.toRT) {
      FboHelper.gl.setRenderTarget(originalRt)
    }
  }
}
