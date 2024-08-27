import { Camera, ShaderMaterial, Texture, WebGLRenderTarget } from "three"
import { FboHelper } from "./FBOHelper"

export class Pass {
  material: ShaderMaterial | null = null

  renderOrder = 0

  _hasShownWarning = false

  enabled: boolean = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init(e?: { [x: string]: any }) {
    Object.assign(this, e)
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  resize(_width: number, _height: number) {
    //
  }

  render(
    texture: Texture,
    renderTarget: WebGLRenderTarget,
    camera: Camera,
    renderToScreen = false,
    overrideTexture = false
  ) {
    if (this.material && this.material.uniforms.u_texture && !overrideTexture) {
      this.material.uniforms.u_texture.value = texture
    }

    if (this.material) {
      FboHelper.render(this.material, camera, renderToScreen ? null : renderTarget)
    }
  }
}
