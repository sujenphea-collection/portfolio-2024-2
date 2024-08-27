import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  Camera,
  CineonToneMapping,
  ColorManagement,
  ColorSpace,
  LinearToneMapping,
  NeutralToneMapping,
  ReinhardToneMapping,
  SRGBTransfer,
  Texture,
  ToneMapping,
  WebGLRenderTarget,
} from "three"
import { FboHelper } from "../../experience/FBOHelper"
import { Pass } from "../../experience/Pass"
import fragmentShader from "./outputPassFrag.glsl"

export class OutputPass extends Pass {
  uniforms = {
    u_texture: { value: null },
    u_toneMappingExposure: { value: 1 },
  }

  _toneMapping?: ToneMapping

  _outputColorSpace?: ColorSpace

  init() {
    this.material = FboHelper.createRawShaderMaterial({
      uniforms: this.uniforms,
      fragmentShader,
    })

    this.renderOrder = 10
  }

  render(
    texture: Texture,
    renderTarget: WebGLRenderTarget,
    camera: Camera,
    renderToScreen?: boolean,
    overrideTexture?: boolean
  ) {
    if (!this.material) {
      return
    }

    this.uniforms.u_toneMappingExposure.value = FboHelper.gl.toneMappingExposure
    if (this._outputColorSpace !== FboHelper.gl.outputColorSpace || this._toneMapping !== FboHelper.gl.toneMapping) {
      this._outputColorSpace = FboHelper.gl.outputColorSpace
      this._toneMapping = FboHelper.gl.toneMapping

      this.material.defines = {}

      if (ColorManagement.getTransfer(this._outputColorSpace) === SRGBTransfer) {
        this.material.defines.SRGB_TRANSFER = ""
      }

      if (this._toneMapping === LinearToneMapping) this.material.defines.LINEAR_TONE_MAPPING = ""
      else if (this._toneMapping === ReinhardToneMapping) this.material.defines.REINHARD_TONE_MAPPING = ""
      else if (this._toneMapping === CineonToneMapping) this.material.defines.CINEON_TONE_MAPPING = ""
      else if (this._toneMapping === ACESFilmicToneMapping) this.material.defines.ACES_FILMIC_TONE_MAPPING = ""
      else if (this._toneMapping === AgXToneMapping) this.material.defines.AGX_TONE_MAPPING = ""
      else if (this._toneMapping === NeutralToneMapping) this.material.defines.NEUTRAL_TONE_MAPPING = ""

      this.material.needsUpdate = true
    }

    super.render(texture, renderTarget, camera, renderToScreen, overrideTexture)
  }
}
