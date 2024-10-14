import {
  BufferGeometry,
  Color,
  HalfFloatType,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Plane,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three"

// ref: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Reflector.js
export class Reflector extends Mesh {
  isReflector: boolean

  camera: PerspectiveCamera

  renderTarget: WebGLRenderTarget

  // render
  reflectorPlane = new Plane()

  normal = new Vector3()

  reflectorWorldPosition = new Vector3()

  cameraWorldPosition = new Vector3()

  rotationMatrix = new Matrix4()

  lookAtPosition = new Vector3(0, 0, -1)

  clipPlane = new Vector4()

  view = new Vector3()

  target = new Vector3()

  q = new Vector4()

  textureMatrix = new Matrix4()

  virtualCamera: PerspectiveCamera

  // options
  color: Color

  textureWidth: number

  textureHeight: number

  clipBias: number

  shader: ShaderMaterial

  multisample: number

  constructor(
    geometry: BufferGeometry,
    options: {
      color?: string
      textureWidth?: number
      textureHeight?: number
      clipBias?: number
      shader?: ShaderMaterial
      multisample?: number
    } = {}
  ) {
    super(geometry)

    this.isReflector = true
    // this.type = "Reflector"

    this.camera = new PerspectiveCamera()
    this.virtualCamera = this.camera

    this.color = options.color !== undefined ? new Color(options.color) : new Color(8355711)
    this.textureWidth = options.textureWidth || 512
    this.textureHeight = options.textureHeight || 512
    this.clipBias = options.clipBias || 0
    this.shader = options.shader || this.reflectorShader
    this.multisample = options.multisample !== undefined ? options.multisample : 4

    this.shader = options.shader || this.reflectorShader

    this.renderTarget = new WebGLRenderTarget(this.textureWidth, this.textureHeight, {
      samples: this.multisample,
      type: HalfFloatType,
    })

    const material = new ShaderMaterial({
      name: this.shader.name !== undefined ? this.shader.name : "unspecified",
      uniforms: this.shader.uniforms,
      fragmentShader: this.shader.fragmentShader,
      vertexShader: this.shader.vertexShader,
    })

    material.uniforms.u_texture.value = this.renderTarget.texture
    material.uniforms.u_color.value = this.color
    material.uniforms.u_textureMatrix.value = this.textureMatrix

    this.material = material
  }

  onBeforeRender(
    _renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    geometry: BufferGeometry,
    _material: ShaderMaterial
  ): void {
    const material = _material

    material.uniforms.u_texture.value = this.renderTarget.texture
    material.uniforms.u_textureMatrix.value = this.textureMatrix

    const renderer = _renderer

    this.reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld)
    this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

    this.rotationMatrix.extractRotation(this.matrixWorld)

    this.normal.set(0, 0, 1)
    this.normal.applyMatrix4(this.rotationMatrix)

    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition)

    // Avoid rendering when reflector is facing away

    if (this.view.dot(this.normal) > 0) return

    this.view.reflect(this.normal).negate()
    this.view.add(this.reflectorWorldPosition)

    this.rotationMatrix.extractRotation(camera.matrixWorld)

    this.lookAtPosition.set(0, 0, -1)
    this.lookAtPosition.applyMatrix4(this.rotationMatrix)
    this.lookAtPosition.add(this.cameraWorldPosition)

    this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition)
    this.target.reflect(this.normal).negate()
    this.target.add(this.reflectorWorldPosition)

    this.virtualCamera.position.copy(this.view)
    this.virtualCamera.up.set(0, 1, 0)
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix)
    this.virtualCamera.up.reflect(this.normal)
    this.virtualCamera.lookAt(this.target)

    this.virtualCamera.far = camera.far // Used in WebGLBackground

    this.virtualCamera.updateMatrixWorld()
    this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix)

    // Update the texture matrix
    this.textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix)
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse)
    this.textureMatrix.multiply(this.matrixWorld)

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition)
    this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse)

    this.clipPlane.set(
      this.reflectorPlane.normal.x,
      this.reflectorPlane.normal.y,
      this.reflectorPlane.normal.z,
      this.reflectorPlane.constant
    )

    const projectionMatrix = this.virtualCamera.projectionMatrix

    this.q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    this.q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    this.q.z = -1.0
    this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

    // Calculate the scaled plane vector
    this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q))

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = this.clipPlane.x
    projectionMatrix.elements[6] = this.clipPlane.y
    projectionMatrix.elements[10] = this.clipPlane.z + 1.0 - this.clipBias
    projectionMatrix.elements[14] = this.clipPlane.w

    // Render
    this.visible = false
    // hide unshown things
    scene.traverse((obj) => {
      if (!(obj.userData.reflect ?? true)) {
        // eslint-disable-next-line no-param-reassign
        obj.visible = false
      }
    })

    const currentRenderTarget = renderer.getRenderTarget()

    const currentXrEnabled = renderer.xr.enabled
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

    renderer.xr.enabled = false // Avoid camera modification
    renderer.shadowMap.autoUpdate = false // Avoid re-computing shadows

    renderer.setRenderTarget(this.renderTarget)

    renderer.state.buffers.depth.setMask(true) // make sure the depth buffer is writable so it can be properly cleared, see #18897

    if (renderer.autoClear === false) renderer.clear()
    renderer.render(scene, this.virtualCamera)

    renderer.xr.enabled = currentXrEnabled
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate

    renderer.setRenderTarget(currentRenderTarget)

    // Restore viewport

    const viewport = camera.viewport

    if (viewport !== undefined) {
      renderer.state.viewport(viewport)
    }

    this.visible = true
    // unhide unshown things
    scene.traverse((obj) => {
      if (!(obj.userData.reflect ?? true)) {
        // eslint-disable-next-line no-param-reassign
        obj.visible = true
      }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  getRenderTarget() {
    return this.renderTarget
  }

  dispose() {
    this.renderTarget.dispose()
    ;(this.material as ShaderMaterial).dispose()
  }

  /* --------------------------------- private -------------------------------- */
  // eslint-disable-next-line class-methods-use-this
  get reflectorShader() {
    return new ShaderMaterial({
      name: "ReflectorShader",
      uniforms: {
        u_color: { value: null },
        u_texture: { value: null },
        u_textureMatrix: { value: null },
      },
      vertexShader: `
        uniform mat4 u_textureMatrix;
        varying vec4 v_uv;
    
        #include <common>
        #include <logdepthbuf_pars_vertex>
    
        void main() {
          v_uv = u_textureMatrix * vec4( position, 1.0 );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
          #include <logdepthbuf_vertex>
        }
      `,
      fragmentShader: `
        uniform vec3 u_color;
        uniform sampler2D u_texture;
        varying vec4 v_uv;
    
        #include <logdepthbuf_pars_fragment>
    
        float blendOverlay( float base, float blend ) {
          return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
        }
    
        vec3 blendOverlay( vec3 base, vec3 blend ) {
          return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
        }
    
        void main() {
          #include <logdepthbuf_fragment>
    
          vec4 base = texture2DProj( u_texture, v_uv );
          gl_FragColor = vec4( blendOverlay( base.rgb, u_color ), 1.0 );
    
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
  }
}
