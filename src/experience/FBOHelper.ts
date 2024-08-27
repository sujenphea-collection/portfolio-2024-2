import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  ClampToEdgeWrapping,
  Color,
  LinearFilter,
  Material,
  Mesh,
  NoBlending,
  RawShaderMaterial,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  ShaderMaterialParameters,
  Texture,
  UnsignedByteType,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three"
import blitFrag from "../shaders/postprocessing/blitFrag.glsl"
import blitVert from "../shaders/postprocessing/blitVert.glsl"

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
type ColorState = {
  autoClear: boolean
  autoClearColor: boolean
  autoClearStencil: boolean
  autoClearDepth: boolean
  clearColor: number
  clearAlpha: number
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export class FboHelper {
  static gl: WebGLRenderer

  // tri
  static triGeom = new BufferGeometry()

  static _tri = new Mesh()

  static _scene = new Scene()

  // materials
  static copyMaterial: ShaderMaterial

  // prescision
  static precisionPrefix = ""

  static init(gl: WebGLRenderer) {
    this.gl = gl

    // init geometries
    this.triGeom.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 4, -1, 0, -1, 4, 0]), 3))

    // init mesh
    this._tri.geometry = this.triGeom
    this._tri.frustumCulled = false
    this._scene.add(this._tri)

    // get precision
    this.precisionPrefix = `precision ${this.gl.capabilities.precision} float;\n`

    // setup materials
    this.copyMaterial = new RawShaderMaterial({
      uniforms: { u_texture: { value: null } },
      vertexShader: this.precisionPrefix + blitVert,
      fragmentShader: this.precisionPrefix + blitFrag,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    })
  }

  static render(material: Material, camera: Camera, renderTarget: WebGLRenderTarget | null) {
    this._tri.material = material

    this.gl.setRenderTarget(renderTarget)

    this.gl.render(this._scene, camera)

    this.gl.setRenderTarget(null)
  }

  static copy(texture: Texture, camera: Camera, renderTarget: WebGLRenderTarget | null) {
    if (!this.copyMaterial) {
      this.copyMaterial = new RawShaderMaterial({
        uniforms: { u_texture: { value: null } },
        vertexShader: this.precisionPrefix + blitVert,
        fragmentShader: this.precisionPrefix + blitFrag,
        depthTest: false,
        depthWrite: false,
        blending: NoBlending,
      })
    }

    this.copyMaterial.uniforms.u_texture.value = texture
    this.render(this.copyMaterial, camera, renderTarget)
  }

  /* ---------------------------------- color --------------------------------- */
  static getColorState() {
    const color = new Color()
    this.gl.getClearColor(color)

    return {
      autoClear: this.gl.autoClear,
      autoClearColor: this.gl.autoClearColor,
      autoClearStencil: this.gl.autoClearStencil,
      autoClearDepth: this.gl.autoClearDepth,
      clearColor: color.getHex(),
      clearAlpha: this.gl.getClearAlpha(),
    }
  }

  static setColorState(state: ColorState) {
    if (!this.gl) {
      return
    }

    this.gl.setClearColor(state.clearColor, state.clearAlpha)
    this.gl.autoClear = state.autoClear
    this.gl.autoClearColor = state.autoClearColor
    this.gl.autoClearStencil = state.autoClearStencil
    this.gl.autoClearDepth = state.autoClearDepth
  }

  /* ----------------------------- render targets ----------------------------- */
  static createRenderTarget(width: number, height: number, samples = 0) {
    return new WebGLRenderTarget(width, height, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      type: UnsignedByteType,
      anisotropy: 0,
      colorSpace: SRGBColorSpace,
      // depthBuffer: false,
      stencilBuffer: false,
      samples,
    })
  }

  /* -------------------------------- materials ------------------------------- */
  static createRawShaderMaterial(
    options: ShaderMaterialParameters & { vertexShaderPrefix?: string; fragmentShaderPrefix?: string }
  ) {
    const _options = {
      // depthTest: false,
      // depthWrite: false,
      // blending: NoBlending,
      vertexShader: blitVert,
      fragmentShader: blitFrag,
      ...options,
    }

    _options.vertexShader =
      (_options.vertexShaderPrefix !== undefined ? _options.vertexShaderPrefix : this.precisionPrefix) +
      _options.vertexShader

    _options.fragmentShader =
      (_options.fragmentShaderPrefix !== undefined ? _options.fragmentShaderPrefix : this.precisionPrefix) +
      _options.fragmentShader

    delete _options.vertexShaderPrefix
    delete _options.fragmentShaderPrefix

    return new RawShaderMaterial(_options)
  }
}
