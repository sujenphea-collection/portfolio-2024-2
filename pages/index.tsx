import { useFrame, useThree } from "@react-three/fiber"
import gsap, { Quad } from "gsap"
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import {
  AddEquation,
  AdditiveBlending,
  BufferGeometry,
  Color,
  CustomBlending,
  DataTexture,
  Euler,
  FloatType,
  Group,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Matrix4,
  Mesh,
  NearestFilter,
  OneFactor,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsLib,
  Vector2,
  Vector3,
  Vector3Like,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
  ZeroFactor,
} from "three"
import { clamp, randFloat } from "three/src/math/MathUtils"
import { Three } from "../src/experience/Three"
import dirtFrag from "../src/shaders/dirt/dirtFrag.glsl"
import dirtVert from "../src/shaders/dirt/dirtVert.glsl"
import groundFrag from "../src/shaders/ground/groundFrag.glsl"
import groundVert from "../src/shaders/ground/groundVert.glsl"
import logoFrag from "../src/shaders/logo/logoFrag.glsl"
import logoVert from "../src/shaders/logo/logoVert.glsl"
import particlesFrag from "../src/shaders/particles/particlesFrag.glsl"
import particlesVert from "../src/shaders/particles/particlesVert.glsl"
import screenFrag from "../src/shaders/screen/screenFrag.glsl"
import screenVert from "../src/shaders/screen/screenVert.glsl"
import stageFrag from "../src/shaders/stage/stageFrag.glsl"
import stageVert from "../src/shaders/stage/stageVert.glsl"
import { ItemType, Loader } from "../src/utils/loader"
import { MathUtils } from "../src/utils/math"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
type ExperienceRef = {
  loadItems: (loader: Loader) => void
  resize?: (width: number, height: number) => void
}

/* -------------------------------------------------------------------------- */
/*                                  constants                                 */
/* -------------------------------------------------------------------------- */
const CameraPositions = {
  intro: {
    position: { x: -0.14895584310989712, y: 7.122215642812359, z: 15.57179759908457 },
    rotation: { x: -0.42897346309670187, y: -0.008698803964670862, z: -0.003978580446027203 },
  },
  home: {
    position: { x: -0.034203410629448434, y: 1.2267996112598016, z: 3.6977443998667225 },
    rotation: { x: -0.21248504785893402, y: -0.012491264825962377, z: -0.002694810971032839 },
  },
  projects: {
    position: { x: 0.7317772764108991, y: 1.0346202518946779, z: 0.8078307272048384 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  about: {
    position: { x: -0.018808307775197538, y: 0.4989437981795135, z: 2.0269110132599835 },
    rotation: { x: -0.09303697822124293, y: -0.0059999620528716794, z: -0.0005598311410729142 },
  },
  about2: {
    position: { x: -1.0542873929824532, y: 0.5226093590653846, z: 1.7595346290785845 },
    rotation: { x: -0.1832165381986701, y: -0.8497477741541486, z: -0.13828896837219806 },
  },
  contact: {
    position: { x: -0.014080253455143561, y: 0.8656767589002491, z: 0.3801748125186579 },
    rotation: { x: -0.09037316641352619, y: -0.0018096685636522448, z: -0.00016399208883666885 },
  },
}

// ids
const homeSectionId = "homeSectionId"

const projectsSectionId = "projectsSectionId"

const aboutSectionId = "aboutSectionId"
const aboutIntroId = "aboutIntroId"
const aboutContentId = "aboutContentId"

const contactSectionId = "contactSectionId"

// css
const basePadding = "px-[max(3.5vw,40px)] py-[clamp(30px,2.4vw,50px)]"

/* -------------------------------------------------------------------------- */
/*                                 experience                                 */
/* -------------------------------------------------------------------------- */
const Particles = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const particlesGeometryRef = useRef<InstancedBufferGeometry | null>(null)
  const particlesUniforms = useRef({
    u_time: { value: 0 },
  })

  /* -------------------------------- functions ------------------------------- */
  const loadItems = () => {}

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    particlesUniforms.current.u_time.value += delta
  })

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    if (!props.show) {
      return
    }

    const refGeometry = new PlaneGeometry(0.01, 0.01)
    const geometry = particlesGeometryRef.current ?? new InstancedBufferGeometry()

    Object.keys(refGeometry.attributes).forEach((attr) => {
      geometry.setAttribute(attr, refGeometry.getAttribute(attr))
    })
    geometry.setIndex(refGeometry.index)

    const instances = 800
    const instancePositions = new Float32Array(instances * 3)
    const instanceRands = new Float32Array(instances * 1)
    const instanceOpacity = new Float32Array(instances * 1)
    const instanceScale = new Float32Array(instances * 1)
    for (let i = 0, i3 = 0; i < instances; i += 1, i3 += 3) {
      instancePositions[i3 + 0] = randFloat(-5, 2)
      instancePositions[i3 + 1] = 2.5
      instancePositions[i3 + 2] = randFloat(-4, 4)

      instanceRands[i] = randFloat(0, 5)
      instanceOpacity[i] = randFloat(0.4, 1.0)
      instanceScale[i] = randFloat(0.6, 1.0)
    }

    geometry.setAttribute("a_instancePosition", new InstancedBufferAttribute(instancePositions, 3))
    geometry.setAttribute("a_instanceRand", new InstancedBufferAttribute(instanceRands, 1))
    geometry.setAttribute("a_instanceOpacity", new InstancedBufferAttribute(instanceOpacity, 1))
    geometry.setAttribute("a_instanceScale", new InstancedBufferAttribute(instanceOpacity, 1))
    geometry.instanceCount = instances

    // set geometry
    particlesGeometryRef.current = geometry
  }, [props.show])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh renderOrder={10} frustumCulled={false} userData={{ reflect: false }}>
          <instancedBufferGeometry ref={particlesGeometryRef} />
          <shaderMaterial
            uniforms={particlesUniforms.current}
            vertexShader={particlesVert}
            fragmentShader={particlesFrag}
            transparent
            depthTest={false}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      </group>
    )
  )
})
Particles.displayName = "Particles"

const Dirt = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  // scene
  const dirtMeshRef = useRef<Mesh<InstancedBufferGeometry, ShaderMaterial> | null>(null)
  const dirtUniformsRef = useRef({
    u_time: { value: 0 },

    u_offsetTexture: { value: null as DataTexture | null },
  })

  // constants
  const DIRT_COUNT = useRef(32768)

  // params
  const mouseDataTexture = useRef<DataTexture | null>(null)
  const mouseParams = useRef({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    prevX: 0,
    prevY: 0,

    gridSize: 36,
    offsetLerp: 0.9,
    mouse: 0.5,
    strength: 0.25,
    hoverSize: 1,
  })

  /* -------------------------------- functions ------------------------------- */
  const loadItems = () => {}

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    dirtUniformsRef.current.u_time.value += delta

    // update position
    dirtMeshRef.current?.scale.setScalar(12)

    // update mouse
    const data = mouseDataTexture.current?.image.data

    // - lerp offset
    if (data) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] *= mouseParams.current.offsetLerp
        data[i + 1] *= mouseParams.current.offsetLerp
      }
    }

    // - add mouse hover
    if (data) {
      const gridWidth = mouseParams.current.gridSize
      const gridHeight = mouseParams.current.gridSize

      const gridMouseX = gridWidth * mouseParams.current.x
      const gridMouseY = gridHeight * (1 - mouseParams.current.y)

      const aspect = 1
      const maxDist = gridWidth * mouseParams.current.mouse

      for (let i = 0; i < gridWidth; i += 1) {
        for (let j = 0; j < gridHeight; j += 1) {
          const distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2

          if (distance < mouseParams.current.hoverSize) {
            const index = 4 * (i + gridWidth * j)

            let power = maxDist / Math.sqrt(distance)
            power = clamp(power, 0, 10)

            data[index] += mouseParams.current.strength * mouseParams.current.velocityX * power
            data[index + 1] -= mouseParams.current.strength * mouseParams.current.velocityY * power
          }
        }
      }

      mouseParams.current.velocityX *= 0.9
      mouseParams.current.velocityY *= 0.9
    }

    // - update texture
    if (mouseDataTexture.current) {
      mouseDataTexture.current.needsUpdate = true
    }
  })

  /* --------------------------------- effects -------------------------------- */
  // setup
  useEffect(() => {
    if (!props.show) {
      return
    }

    // setup geometry
    const geometry = dirtMeshRef.current?.geometry ?? new InstancedBufferGeometry()
    const refGeometry = new PlaneGeometry(1, 1)
    refGeometry.rotateX(Math.PI * -0.5)
    Object.keys(refGeometry.attributes).forEach((attribute) => {
      geometry.setAttribute(attribute, refGeometry.getAttribute(attribute))
    })
    geometry.index = refGeometry.index

    // setup instance
    const rand = MathUtils.getSeedRandomFn("dirt")
    const instancePos = new Float32Array(DIRT_COUNT.current * 3)
    const instanceRand = new Float32Array(DIRT_COUNT.current * 4)
    for (let i = 0, i3 = 0, i4 = 0; i < DIRT_COUNT.current; i += 1, i3 += 3, i4 += 4) {
      instancePos[i3 + 0] = (rand() * 2 - 1) * 0.5
      instancePos[i3 + 1] = 0
      instancePos[i3 + 2] = (rand() * 2 - 1) * 0.5

      instanceRand[i4 + 0] = rand()
      instanceRand[i4 + 1] = rand()
      instanceRand[i4 + 2] = rand()
      instanceRand[i4 + 3] = rand()
    }

    geometry.setAttribute("instancePos", new InstancedBufferAttribute(instancePos, 3))
    geometry.setAttribute("instanceRands", new InstancedBufferAttribute(instanceRand, 4))

    if (dirtMeshRef.current) {
      dirtMeshRef.current.geometry = geometry
    }
  }, [props.show])

  // setup mouse
  useEffect(() => {
    // setup grid
    const width = mouseParams.current.gridSize
    const height = mouseParams.current.gridSize
    const size = width * height
    const data = new Float32Array(4 * size)

    mouseDataTexture.current = new DataTexture(data, width, height, RGBAFormat, FloatType)
    mouseDataTexture.current.magFilter = NearestFilter
    mouseDataTexture.current.minFilter = NearestFilter

    dirtUniformsRef.current.u_offsetTexture.value = mouseDataTexture.current
    dirtUniformsRef.current.u_offsetTexture.value.needsUpdate = true
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh
          ref={dirtMeshRef}
          renderOrder={10}
          onPointerMove={(ev) => {
            mouseParams.current.x = ev.uv?.x ?? 0
            mouseParams.current.y = 1 - (ev.uv?.y ?? 0)

            mouseParams.current.velocityX = mouseParams.current.x - mouseParams.current.prevX
            mouseParams.current.velocityY = mouseParams.current.y - mouseParams.current.prevY

            mouseParams.current.prevX = mouseParams.current.x
            mouseParams.current.prevY = mouseParams.current.y
          }}
        >
          <instancedBufferGeometry instanceCount={DIRT_COUNT.current} />
          <shaderMaterial
            uniforms={dirtUniformsRef.current}
            vertexShader={dirtVert}
            fragmentShader={dirtFrag}
            depthTest={false}
            depthWrite={false}
            blending={CustomBlending}
            blendEquation={AddEquation}
            blendDst={OneFactor}
            blendSrc={OneFactor}
            blendEquationAlpha={AddEquation}
            blendDstAlpha={OneFactor}
            blendSrcAlpha={ZeroFactor}
          />
        </mesh>
      </group>
    )
  )
})
Dirt.displayName = "Dirt"

const Ground = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  // load
  const floorBakedTexture = useRef<Texture | null>(null)

  // render targets
  const renderTarget = useRef(new WebGLRenderTarget(512, 512, { samples: 4, type: HalfFloatType }))

  // reflector
  const reflectorParams = useRef({
    clipBias: 0,
    reflectorPlane: new Plane(),
    normal: new Vector3(),
    reflectorWorldPosition: new Vector3(),
    cameraWorldPosition: new Vector3(),
    rotationMatrix: new Matrix4(),
    lookAtPosition: new Vector3(0, 0, -1),
    clipPlane: new Vector4(),
    view: new Vector3(),
    target: new Vector3(),
    q: new Vector4(),
    textureMatrix: new Matrix4(),
    virtualCamera: new PerspectiveCamera(),
  })

  // scene
  const groundMesh = useRef<Mesh | null>(null)

  const groundUniforms = useRef({
    u_color: { value: new Color(0xffffff) },
    u_texture: { value: renderTarget.current.texture },
    u_textureMatrix: { value: reflectorParams.current.textureMatrix },

    u_scale: { value: 3.0 },

    u_shadowShowRatio: { value: 1 },

    u_shadowTexture: { value: null as Texture | null },
    u_maskTexture: { value: null as Texture | null },

    ...UniformsLib.fog,
  })

  /* -------------------------------- functions ------------------------------- */
  const loadItems = (loader: Loader) => {
    loader.add("/textures/floor-baked.jpg", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.minFilter = LinearFilter
        tex.magFilter = LinearFilter

        floorBakedTexture.current = tex
        groundUniforms.current.u_shadowTexture.value = tex
      },
    })

    loader.add("/textures/floor.png", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping

        groundUniforms.current.u_maskTexture.value = tex
      },
    })
  }

  const onReflectorBeforeRender = (gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) => {
    if (!groundMesh.current) {
      return
    }

    const scope = groundMesh.current
    reflectorParams.current.reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld)
    reflectorParams.current.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

    reflectorParams.current.rotationMatrix.extractRotation(scope.matrixWorld)

    reflectorParams.current.normal.set(0, 0, 1)
    reflectorParams.current.normal.applyMatrix4(reflectorParams.current.rotationMatrix)

    reflectorParams.current.view.subVectors(
      reflectorParams.current.reflectorWorldPosition,
      reflectorParams.current.cameraWorldPosition
    )

    // Avoid rendering when reflector is facing away

    if (reflectorParams.current.view.dot(reflectorParams.current.normal) > 0) return

    reflectorParams.current.view.reflect(reflectorParams.current.normal).negate()
    reflectorParams.current.view.add(reflectorParams.current.reflectorWorldPosition)

    reflectorParams.current.rotationMatrix.extractRotation(camera.matrixWorld)

    reflectorParams.current.lookAtPosition.set(0, 0, -1)
    reflectorParams.current.lookAtPosition.applyMatrix4(reflectorParams.current.rotationMatrix)
    reflectorParams.current.lookAtPosition.add(reflectorParams.current.cameraWorldPosition)

    reflectorParams.current.target.subVectors(
      reflectorParams.current.reflectorWorldPosition,
      reflectorParams.current.lookAtPosition
    )
    reflectorParams.current.target.reflect(reflectorParams.current.normal).negate()
    reflectorParams.current.target.add(reflectorParams.current.reflectorWorldPosition)

    reflectorParams.current.virtualCamera.position.copy(reflectorParams.current.view)
    reflectorParams.current.virtualCamera.up.set(0, 1, 0)
    reflectorParams.current.virtualCamera.up.applyMatrix4(reflectorParams.current.rotationMatrix)
    reflectorParams.current.virtualCamera.up.reflect(reflectorParams.current.normal)
    reflectorParams.current.virtualCamera.lookAt(reflectorParams.current.target)

    reflectorParams.current.virtualCamera.far = camera.far // Used in WebGLBackground

    reflectorParams.current.virtualCamera.updateMatrixWorld()
    reflectorParams.current.virtualCamera.projectionMatrix.copy(camera.projectionMatrix)

    // Update the texture matrix
    reflectorParams.current.textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    )
    reflectorParams.current.textureMatrix.multiply(reflectorParams.current.virtualCamera.projectionMatrix)
    reflectorParams.current.textureMatrix.multiply(reflectorParams.current.virtualCamera.matrixWorldInverse)
    reflectorParams.current.textureMatrix.multiply(scope.matrixWorld)

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorParams.current.reflectorPlane.setFromNormalAndCoplanarPoint(
      reflectorParams.current.normal,
      reflectorParams.current.reflectorWorldPosition
    )
    reflectorParams.current.reflectorPlane.applyMatrix4(reflectorParams.current.virtualCamera.matrixWorldInverse)

    reflectorParams.current.clipPlane.set(
      reflectorParams.current.reflectorPlane.normal.x,
      reflectorParams.current.reflectorPlane.normal.y,
      reflectorParams.current.reflectorPlane.normal.z,
      reflectorParams.current.reflectorPlane.constant
    )

    const projectionMatrix = reflectorParams.current.virtualCamera.projectionMatrix

    reflectorParams.current.q.x =
      (Math.sign(reflectorParams.current.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    reflectorParams.current.q.y =
      (Math.sign(reflectorParams.current.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    reflectorParams.current.q.z = -1.0
    reflectorParams.current.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

    // Calculate the scaled plane vector
    reflectorParams.current.clipPlane.multiplyScalar(
      2.0 / reflectorParams.current.clipPlane.dot(reflectorParams.current.q)
    )

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = reflectorParams.current.clipPlane.x
    projectionMatrix.elements[6] = reflectorParams.current.clipPlane.y
    projectionMatrix.elements[10] = reflectorParams.current.clipPlane.z + 1.0 - reflectorParams.current.clipBias
    projectionMatrix.elements[14] = reflectorParams.current.clipPlane.w

    // render
    const currentRenderTarget = gl.getRenderTarget()

    const currentXrEnabled = gl.xr.enabled
    const currentShadowautoUpdate = gl.shadowMap.autoUpdate

    // eslint-disable-next-line no-param-reassign
    gl.xr.enabled = !1
    // eslint-disable-next-line no-param-reassign
    gl.shadowMap.autoUpdate = !1

    gl.setRenderTarget(renderTarget.current)

    // hide unshown things
    scene.traverse((obj) => {
      if (!(obj.userData.reflect ?? true)) {
        // eslint-disable-next-line no-param-reassign
        obj.visible = false
      }
    })

    gl.render(scene, reflectorParams.current.virtualCamera)
    gl.setRenderTarget(null)

    // restore state
    // eslint-disable-next-line no-param-reassign
    gl.xr.enabled = currentXrEnabled
    // eslint-disable-next-line no-param-reassign
    gl.shadowMap.autoUpdate = currentShadowautoUpdate

    // restore unshown things
    scene.traverse((obj) => {
      if (!(obj.userData.reflect ?? true)) {
        // eslint-disable-next-line no-param-reassign
        obj.visible = true
      }
    })

    gl.setRenderTarget(currentRenderTarget)
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
    resize: () => {
      renderTarget.current.setSize(window.innerWidth, window.innerHeight)
    },
  }))

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh
          ref={groundMesh}
          onBeforeRender={onReflectorBeforeRender}
          rotation={[Math.PI * -0.5, 0, 0]}
          position={[0, 0.01, 0]}
          scale={[3, 3, 3]}
        >
          <planeGeometry args={[12, 12]} />
          <shaderMaterial uniforms={groundUniforms.current} vertexShader={groundVert} fragmentShader={groundFrag} fog />
        </mesh>
      </group>
    )
  )
})
Ground.displayName = "Ground"

const Stage = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  // scene
  const floorGeometryRef = useRef<BufferGeometry | null>(null)
  const floorBoxGeometryRef = useRef<BufferGeometry | null>(null)
  const screenLeftGeometryRef = useRef<BufferGeometry | null>(null)
  const screenRightGeometryRef = useRef<BufferGeometry | null>(null)

  const screenLeftMeshRef = useRef<Mesh | null>(null)
  const screenRightMeshRef = useRef<Mesh | null>(null)

  const floorUniforms = useRef({
    u_scale: { value: 0.1 },
    u_time: { value: 0 },

    u_showRatio: { value: 1 },

    // color
    color_top: { value: new Color(0xedf2fb) },
    color_bottom: { value: new Color(0x001845) },

    // noise
    u_noiseTexture: { value: null as Texture | null },
    u_noiseTexelSize: { value: new Vector2() },
    u_noiseCoordOffset: { value: new Vector2() },
  })

  const screenUniforms = useRef({
    u_texture: { value: null as Texture | null },
    u_texture2: { value: null as Texture | null },
    u_mixTexture: { value: null as Texture | null },
    u_noiseTexture: { value: null as Texture | null },

    u_time: { value: 0 },
    u_showRatio: { value: 1 },
    u_mixRatio: { value: 0 },

    u_mouse: { value: new Vector2() },
  })

  // ui
  const homeUI = useRef(document.getElementById(homeSectionId))
  const projectsUI = useRef(document.getElementById(projectsSectionId))
  const projectsIndividualUI = useRef<HTMLElement[]>([])
  const contactUI = useRef(document.getElementById(contactSectionId))

  // params
  const mouse = useRef({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    prevX: 0,
    prevY: 0,
  })

  const projectTextures = useRef<(Texture | null)[]>([])

  /* -------------------------------- functions ------------------------------- */
  const loadItems = (loader: Loader) => {
    loader.add("/models/stage.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            floorGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/models/stageBox.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            floorBoxGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/models/screenLeft.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            screenLeftGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/models/screenRight.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            screenRightGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/textures/noise.png", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture

        tex.generateMipmaps = false
        tex.minFilter = LinearFilter
        tex.magFilter = LinearFilter
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping

        floorUniforms.current.u_noiseTexture.value = tex
        floorUniforms.current.u_noiseTexelSize.value.set(1 / 128, 1 / 128)
      },
    })

    loader.add("/projects/balance.mp4", ItemType.VideoTexture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.userData.video.play()
        tex.userData.video.loop = true

        screenUniforms.current.u_texture.value = tex
        projectTextures.current[0] = tex
        projectTextures.current[2] = tex
      },
    })

    loader.add("/projects/project2.png", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true

        screenUniforms.current.u_texture2.value = tex
        projectTextures.current[1] = tex
      },
    })

    loader.add("/textures/transition.jpg", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping

        screenUniforms.current.u_mixTexture.value = tex
      },
    })

    loader.add("/textures/noise.png", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping

        screenUniforms.current.u_noiseTexture.value = tex
      },
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    const homeBounds = homeUI.current?.getBoundingClientRect()
    const contactBounds = contactUI.current?.getBoundingClientRect()

    // home
    const homeTop = homeBounds?.top ?? 0
    const homeShowScreenOffset = (Properties.viewportHeight - homeTop) / Properties.viewportHeight

    // show ratio
    // const screenShowRatio = MathUtils.fit(homeShowScreenOffset, 1.4, 2, 0, 1, easeInOut)
    // screenUniforms.current.u_showRatio.value = screenShowRatio

    const stageShowRatio = MathUtils.fit(homeShowScreenOffset, 1, 2, 0, 1)
    floorUniforms.current.u_showRatio.value = stageShowRatio

    // mix ratio
    let ratio = 0
    let index = 0
    projectsIndividualUI.current.forEach((el, i) => {
      if (window.scrollY > el.offsetTop) {
        index = i
      }
    })

    if (index <= projectTextures.current.length - 1) {
      screenUniforms.current.u_texture.value =
        index <= 0 ? projectTextures.current[0] : projectTextures.current[index - 1]
      screenUniforms.current.u_texture2.value = projectTextures.current[index]

      const bounds = projectsIndividualUI.current[index].getBoundingClientRect()
      ratio = MathUtils.fit(bounds.top, 0, -bounds.height * 0.2, 0, 1)
    }

    screenUniforms.current.u_mixRatio.value = ratio

    // contact - move screen
    const contactTop = contactBounds?.top ?? 0
    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight
    const contactSplitRatio = MathUtils.fit(contactShowScreenOffset, 1, 1.5, 0, 1, Quad.easeInOut)

    const splitOffset = MathUtils.mix(contactSplitRatio, 0, 0.5)

    screenLeftMeshRef.current?.position.setX(-splitOffset)
    screenRightMeshRef.current?.position.setX(splitOffset)

    // mouse
    const velocity = { x: mouse.current.velocityX * 10, y: mouse.current.velocityY * 10 }
    velocity.x = clamp(velocity.x, -1, 1)
    velocity.y = clamp(velocity.y, -1, 1)
    screenUniforms.current.u_mouse.value.lerp(velocity, 0.2)

    mouse.current.velocityX *= 0.9
    mouse.current.velocityY *= 0.9

    // update uniforms
    screenUniforms.current.u_time.value += delta
    floorUniforms.current.u_time.value += delta
  })

  /* --------------------------------- effects -------------------------------- */
  // setup UI
  useEffect(() => {
    Array.from(projectsUI.current?.children || []).forEach((el) => {
      projectsIndividualUI.current.push(el as HTMLElement)
      projectTextures.current.push(null)
    })
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        {/* floor */}
        <mesh geometry={floorGeometryRef.current ?? undefined} userData={{ reflect: false }}>
          <shaderMaterial
            uniforms={floorUniforms.current}
            vertexShader={stageVert}
            fragmentShader={stageFrag}
            transparent
          />
        </mesh>

        <mesh position={[0, 0.1, 0]} geometry={floorBoxGeometryRef.current ?? undefined} userData={{ reflect: false }}>
          <shaderMaterial
            uniforms={floorUniforms.current}
            vertexShader={stageVert}
            fragmentShader={stageFrag}
            transparent
          />
        </mesh>

        {/* screen */}
        <mesh ref={screenLeftMeshRef} geometry={screenLeftGeometryRef.current ?? undefined}>
          <shaderMaterial
            uniforms={screenUniforms.current}
            vertexShader={screenVert}
            fragmentShader={screenFrag}
            transparent
          />
        </mesh>

        <mesh ref={screenRightMeshRef} geometry={screenRightGeometryRef.current ?? undefined}>
          <shaderMaterial
            uniforms={screenUniforms.current}
            vertexShader={screenVert}
            fragmentShader={screenFrag}
            transparent
          />
        </mesh>

        {/* pointer mesh */}
        <mesh
          position={[0, 1, -3.2]}
          scale={[3.7, 2.12, 1]}
          visible={false}
          onPointerMove={(ev) => {
            mouse.current.x = ((ev.uv?.x ?? 0.5) - 0.5) * 2 // between -1 and 1
            mouse.current.y = ((ev.uv?.y ?? 0.5) - 0.5) * 2 // between -1 and 1

            mouse.current.velocityX = mouse.current.x - mouse.current.prevX
            mouse.current.velocityY = mouse.current.y - mouse.current.prevY

            mouse.current.prevX = mouse.current.x
            mouse.current.prevY = mouse.current.y
          }}
        >
          <planeGeometry />
        </mesh>
      </group>
    )
  )
})
Stage.displayName = "Stage"

const Contact = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  // load
  const xLogoGeometryRef = useRef<BufferGeometry>()
  const githubLogoGeometryRef = useRef<BufferGeometry>()

  // scene
  const xLogoMeshRef = useRef<Mesh | null>(null)
  const githubLogoMeshRef = useRef<Mesh | null>(null)

  // ui
  const contactUI = useRef(document.getElementById(contactSectionId))

  /* -------------------------------- functions ------------------------------- */
  const loadItems = (loader: Loader) => {
    loader.add("/models/xlogo.glb", ItemType.Glb, {
      onLoad: (model) => {
        const group = model.scene as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            xLogoGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/models/github.glb", ItemType.Glb, {
      onLoad: (model) => {
        const group = model.scene as Group

        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            githubLogoGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {
    const contactBounds = contactUI.current?.getBoundingClientRect()

    const contactTop = contactBounds?.top ?? 0
    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight

    let xRatio = MathUtils.fit(contactShowScreenOffset, 1.8, 2.1, 0, 1, Quad.easeInOut)
    let zRatio = MathUtils.fit(contactShowScreenOffset, 1.5, 1.8, 0, 1, Quad.easeInOut)
    xLogoMeshRef.current?.position.setX(MathUtils.mix(0, -0.5, xRatio))
    xLogoMeshRef.current?.position.setY(0.35)
    xLogoMeshRef.current?.position.setZ(MathUtils.mix(-4, -2.3, zRatio))

    xRatio = MathUtils.fit(contactShowScreenOffset, 2.0, 2.3, 0, 1, Quad.easeInOut)
    zRatio = MathUtils.fit(contactShowScreenOffset, 1.7, 2.0, 0, 1, Quad.easeInOut)
    githubLogoMeshRef.current?.position.setX(MathUtils.mix(0, 0.5, xRatio))
    githubLogoMeshRef.current?.position.setY(0.35)
    githubLogoMeshRef.current?.position.setZ(MathUtils.mix(-5, -2.3, zRatio))
  })

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh ref={xLogoMeshRef} geometry={xLogoGeometryRef.current} scale={[0.2, 0.2, 0.2]} position={[0, 0.35, -4]}>
          <shaderMaterial vertexShader={logoVert} fragmentShader={logoFrag} />
        </mesh>

        <mesh
          ref={githubLogoMeshRef}
          geometry={githubLogoGeometryRef.current}
          rotation={[Math.PI * 0.5, 0, 0]}
          scale={[16, 16, 16]}
          position={[0, 0.35, -4]}
        >
          <shaderMaterial vertexShader={logoVert} fragmentShader={logoFrag} />
        </mesh>
      </group>
    )
  )
})
Contact.displayName = "Contact"

// eslint-disable-next-line react/no-unused-prop-types
const Experience = (props: { loader: Loader; preinitComplete: () => void; show: boolean }) => {
  const { camera } = useThree()

  /* ---------------------------------- refs ---------------------------------- */
  // scene
  const particlesRef = useRef<ExperienceRef | null>(null)
  const dirtRef = useRef<ExperienceRef | null>(null)
  const groundRef = useRef<ExperienceRef | null>(null)
  const stageRef = useRef<ExperienceRef | null>(null)
  const contactRef = useRef<ExperienceRef | null>(null)

  // params
  const tempEuler = useRef(new Euler())

  // ui
  const homeUI = useRef(document.getElementById(homeSectionId))
  const projectsUI = useRef(document.getElementById(projectsSectionId))
  const aboutUI = useRef(document.getElementById(aboutSectionId))
  const aboutIntroUI = useRef(document.getElementById(aboutIntroId))

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    // resize scenes
    particlesRef.current?.resize?.(window.innerWidth, window.innerHeight)
    dirtRef.current?.resize?.(window.innerWidth, window.innerHeight)
    groundRef.current?.resize?.(window.innerWidth, window.innerHeight)
    stageRef.current?.resize?.(window.innerWidth, window.innerHeight)
    contactRef.current?.resize?.(window.innerWidth, window.innerHeight)
  }

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {
    const homeBounds = homeUI.current?.getBoundingClientRect()
    const projectsBounds = projectsUI.current?.getBoundingClientRect()
    const aboutBounds = aboutUI.current?.getBoundingClientRect()
    const aboutIntroBounds = aboutIntroUI.current?.getBoundingClientRect()

    // home
    const homeTop = homeBounds?.top ?? 0
    const homeBottom = homeBounds?.bottom ?? 0
    const homeActive = homeTop <= Properties.viewportHeight && homeBottom >= 0
    const homeHideScreenOffset = -homeBottom / Properties.viewportHeight

    // projects
    const projectsShowRatio = MathUtils.fit(homeHideScreenOffset, -1, 0, 0, 1)
    const projectsTop = projectsBounds?.top ?? 0
    const projectsBottom = projectsBounds?.bottom ?? 0
    const projectsActive = projectsTop <= Properties.viewportHeight && projectsBottom >= 0
    const projectsHideScreenOffset = -projectsBottom / Properties.viewportHeight

    // about
    const aboutShowRatio = MathUtils.fit(projectsHideScreenOffset, -1, 0, 0, 1)
    const aboutTop = aboutBounds?.top ?? 0
    const aboutBottom = aboutBounds?.bottom ?? 0
    const aboutActive = aboutTop <= Properties.viewportHeight && aboutBottom >= 0
    const aboutHideScreenOffset = -aboutBottom / Properties.viewportHeight

    const aboutIntroTop = aboutIntroBounds?.top ?? 0
    const aboutIntroBottom = aboutIntroBounds?.bottom ?? 0
    const aboutIntroActive = aboutIntroTop <= Properties.viewportHeight && aboutIntroBottom >= 0
    const aboutIntroHideScreenOffset = -aboutIntroBottom / Properties.viewportHeight

    const aboutContentShowRatio = MathUtils.fit(aboutIntroHideScreenOffset, -1, 0, 0, 1)

    // contact
    const contactShowRatio = MathUtils.fit(aboutHideScreenOffset, -1, 0, 0, 1)

    // get camera
    let cameraPos: Vector3Like
    let cameraRot: Vector3Like
    if (homeActive) {
      cameraPos = MathUtils.mixVec3(CameraPositions.home.position, CameraPositions.projects.position, projectsShowRatio)
      cameraRot = MathUtils.mixVec3(CameraPositions.home.rotation, CameraPositions.projects.rotation, projectsShowRatio)
    } else if (projectsActive) {
      cameraPos = MathUtils.mixVec3(CameraPositions.projects.position, CameraPositions.about.position, aboutShowRatio)
      cameraRot = MathUtils.mixVec3(CameraPositions.projects.rotation, CameraPositions.about.rotation, aboutShowRatio)
    } else if (aboutActive && aboutIntroActive) {
      cameraPos = MathUtils.mixVec3(
        CameraPositions.about.position,
        CameraPositions.about2.position,
        aboutContentShowRatio
      )
      cameraRot = MathUtils.mixVec3(
        CameraPositions.about.rotation,
        CameraPositions.about2.rotation,
        aboutContentShowRatio
      )
    } else if (aboutActive) {
      cameraPos = MathUtils.mixVec3(CameraPositions.about2.position, CameraPositions.contact.position, contactShowRatio)
      cameraRot = MathUtils.mixVec3(CameraPositions.about2.rotation, CameraPositions.contact.rotation, contactShowRatio)
    } else {
      cameraPos = camera.position
      cameraRot = camera.rotation
    }

    // set camera
    camera.position.copy(cameraPos)

    tempEuler.current.set(cameraRot.x, cameraRot.y, cameraRot.z)
    camera.quaternion.setFromEuler(tempEuler.current)
  })

  /* --------------------------------- effects -------------------------------- */
  // load materials
  useEffect(() => {
    particlesRef.current?.loadItems(props.loader)
    dirtRef.current?.loadItems(props.loader)
    groundRef.current?.loadItems(props.loader)
    stageRef.current?.loadItems(props.loader)
    contactRef.current?.loadItems(props.loader)

    props.preinitComplete()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // resize
  useEffect(() => {
    window.addEventListener("resize", resize)
    resize()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  // setup camera
  useEffect(() => {
    camera.position.copy(CameraPositions.intro.position)
    camera.rotation.set(
      CameraPositions.intro.rotation.x,
      CameraPositions.intro.rotation.y,
      CameraPositions.intro.rotation.z
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* scene */}
      <Particles ref={particlesRef} show={props.show} />
      <Dirt ref={dirtRef} show={props.show} />
      <Ground ref={groundRef} show={props.show} />
      <Stage ref={stageRef} show={props.show} />
      <Contact ref={contactRef} show={props.show} />

      <fog args={[0x000000, 15, 25]} attach="fog" />
      <color attach="background" args={[0x000000]} />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 components                                 */
/* -------------------------------------------------------------------------- */
const Preloader = (props: { loader: Loader; startLoader: boolean; onDismiss: () => void }) => {
  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  /* --------------------------------- states --------------------------------- */
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  /* -------------------------------- functions ------------------------------- */
  const progress = useCallback((percent: number) => {
    gsap
      .timeline({
        onComplete: () => {
          if (!loadedRef.current && percent >= 100) {
            loadedRef.current = true
            setLoaded(true)
          }
        },
      })
      .to(progressBarRef.current, { scaleX: `${percent - 0.1}%`, duration: 1 })
  }, [])

  const dismiss = () => {
    props.onDismiss()

    gsap.to(containerRef.current, {
      autoAlpha: 0,
      duration: 0.5,
      delay: 0.2,
    })
  }

  /* --------------------------------- effects -------------------------------- */
  // setup
  useEffect(() => {
    gsap.set(progressBarRef.current, { scaleX: 0 })
  }, [])

  // setup progress
  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    props.loader.onProgress = progress
  }, [progress, props])

  // start loader
  useEffect(() => {
    if (!props.startLoader) {
      return
    }

    props.loader?.start()
  }, [props.loader, props.startLoader])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div ref={containerRef} className={cn("z-[1]", "fixed inset-0", "bg-white")}>
      {/* bg */}
      <div
        className={cn("absolute inset-0", "pointer-events-none select-none")}
        style={{
          background: "linear-gradient(90deg, #E0EAFC, #CFDEF3)",
        }}
      />

      {/* content */}
      <div className={cn("relative h-full w-full", "flex flex-col items-center justify-center")}>
        {/* progress bar */}
        <div className={cn("h-[2px] w-1/4 max-w-[400px]", "rounded-full", "overflow-hidden")}>
          <div
            ref={progressBarRef}
            className={cn("h-full w-full", "rounded-[inherit]", "origin-center")}
            style={{
              background: "linear-gradient(90deg, #141E30, #243B55)",
              backgroundSize: "400px 20px",
              backgroundRepeat: "repeat",
              backgroundOrigin: "center",
            }}
          />
        </div>

        {/* continue button */}
        <button
          type="button"
          disabled={!loaded}
          onClick={dismiss}
          className={cn(
            "relative mt-8",
            "text-bgColor",
            "rounded-[40px]",
            "transition-opacity duration-200",
            "disabled:opacity-40"
          )}
        >
          {/* content */}
          <div className={cn("relative px-10 py-3", "rounded-[inherit] bg-contentColor")}>
            <div className={cn("text-sm font-medium uppercase")}>Continue</div>
          </div>
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export default function Home() {
  /* ---------------------------------- refs ---------------------------------- */
  const sectionsToPreinit = useRef(1)
  const loader = useRef(new Loader(Properties.gl))

  /* --------------------------------- states --------------------------------- */
  const [startLoader, setStartLoader] = useState(false)
  const [show, setShow] = useState(false)

  /* -------------------------------- functions ------------------------------- */
  const onPreinitComplete = () => {
    sectionsToPreinit.current -= 1

    if (sectionsToPreinit.current <= 0) {
      setStartLoader(true)
    }
  }

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      <Three>
        <Experience loader={loader.current} preinitComplete={onPreinitComplete} show={show} />
      </Three>

      {/* loader */}
      <Preloader loader={loader.current} startLoader={startLoader} onDismiss={() => setShow(true)} />

      {/* content */}
      <div className="relative">
        {/* home */}
        <div id={homeSectionId} className="pb-[150vh]">
          <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
            {/* title */}
            <h2 className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}>
              Home
            </h2>

            {/* description */}
            <h4 className={cn("mb-[1.8rem] max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
          </div>
        </div>

        {/* projects */}
        <div id={projectsSectionId}>
          {/* project 1 */}
          <div className="pb-[150vh]">
            <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-start"
                )}
              >
                {/* title */}
                <h2
                  className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
                >
                  Project 1
                </h2>

                {/* description */}
                <h4 className={cn("max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
              </div>
            </div>
          </div>

          {/* project 2 */}
          <div className="pb-[150vh]">
            <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-start"
                )}
              >
                {/* title */}
                <h2
                  className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
                >
                  Project 2
                </h2>

                {/* description */}
                <h4 className={cn("max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
              </div>
            </div>
          </div>

          {/* project 3 */}
          <div className="pb-[150vh]">
            <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-start"
                )}
              >
                {/* title */}
                <h2
                  className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
                >
                  Project 3
                </h2>

                {/* description */}
                <h4 className={cn("max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
              </div>
            </div>
          </div>
        </div>

        {/* about */}
        <div id={aboutSectionId}>
          {/* intro */}
          <div id={aboutIntroId} className="pb-[150vh]">
            <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-start"
                )}
              >
                {/* title */}
                <h2
                  className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
                >
                  About
                </h2>

                {/* description */}
                <h4 className={cn("mb-[1.8rem] max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
              </div>
            </div>
          </div>

          {/* content */}
          <div id={aboutContentId} className="pb-[150vh]">
            <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-start"
                )}
              >
                {/* title */}
                <h2
                  className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
                >
                  About
                </h2>

                {/* description */}
                <h4 className={cn("mb-[1.8rem] max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
              </div>
            </div>
          </div>
        </div>

        {/* contact */}
        <div id={contactSectionId} className="pb-[250vh]">
          <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
            <div
              className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", "flex flex-col items-start")}
            >
              {/* title */}
              <h2
                className={cn("mb-[1.5rem]", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
              >
                Contact
              </h2>

              {/* description */}
              <h4 className={cn("mb-[1.8rem] max-w-[40ch]", "text-[1.25rem]")}>Description</h4>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
