import { useCamera } from "@react-three/drei"
import { createPortal, extend, Object3DNode, useFrame } from "@react-three/fiber"
import gsap, { Quad } from "gsap"
import { useAtom } from "jotai"
import { useRouter } from "next/router"
import { forwardRef, MutableRefObject, useEffect, useImperativeHandle, useRef } from "react"
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
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Intersection,
  LinearFilter,
  Mesh,
  NearestFilter,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsLib,
  Vector2,
  Vector3,
  Vector3Like,
  ZeroFactor,
} from "three"
import { clamp, lerp, randFloat } from "three/src/math/MathUtils"
import { enableScrollAtom, postAnimateIntroSceneAtom } from "../../atoms/sceneAtoms"
import { Reflector } from "../../components/Reflector"
import { Projects } from "../../constants/projects"
import {
  aboutIntroId,
  aboutSectionId,
  contactSectionId,
  githubURL,
  homeSectionId,
  projectsSectionId,
  xURL,
} from "../../constants/uiConstants"
import dirtFrag from "../../shaders/dirt/dirtFrag.glsl"
import dirtVert from "../../shaders/dirt/dirtVert.glsl"
import groundFrag from "../../shaders/ground/groundFrag.glsl"
import groundVert from "../../shaders/ground/groundVert.glsl"
import logoFrag from "../../shaders/logo/logoFrag.glsl"
import logoVert from "../../shaders/logo/logoVert.glsl"
import particlesFrag from "../../shaders/particles/particlesFrag.glsl"
import particlesVert from "../../shaders/particles/particlesVert.glsl"
import screenFrag from "../../shaders/screen/screenFrag.glsl"
import screenVert from "../../shaders/screen/screenVert.glsl"
import stageFrag from "../../shaders/stage/stageFrag.glsl"
import stageVert from "../../shaders/stage/stageVert.glsl"
import { Input } from "../../utils/input"
import { ItemType, Loader } from "../../utils/loader"
import { MathUtils } from "../../utils/math"
import { Properties } from "../../utils/properties"
import { BrownianMotion } from "../BrownianMotion"
import { SceneHandle } from "../types/SceneHandle"

/* -------------------------------------------------------------------------- */
/*                                   extends                                  */
/* -------------------------------------------------------------------------- */
// Extend so the reconciler will learn about it
extend({ Reflector })

// Add types to ThreeElements elements so primitives pick up on it
declare module "@react-three/fiber" {
  interface ThreeElements {
    reflector: Object3DNode<Reflector, typeof Reflector>
  }
}

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
type ExperienceRef = {
  loadItems: (loader: Loader) => void
  resize?: (width: number, height: number) => void
  update?: (delta: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: { opacity: number }
}

// eslint-disable-next-line react/no-unused-prop-types
type ExperienceProps = { show: boolean; raycast: (_: Raycaster, intersects: Intersection[]) => void }
type HomeExperienceProps = {
  loader: Loader
  preinitComplete: () => void
  show: boolean
  introIn: MutableRefObject<boolean>
}

/* -------------------------------------------------------------------------- */
/*                                  constants                                 */
/* -------------------------------------------------------------------------- */
const CameraPositions: {
  [key: string]: {
    mobile: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }
    desktop: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } }
  }
} = {
  intro: {
    mobile: {
      position: { x: -0.14895584310989712, y: 7.122215642812359, z: 15.57179759908457 },
      rotation: { x: -0.42897346309670187, y: -0.008698803964670862, z: -0.003978580446027203 },
    },
    desktop: {
      position: { x: -0.14895584310989712, y: 7.122215642812359, z: 15.57179759908457 },
      rotation: { x: -0.42897346309670187, y: -0.008698803964670862, z: -0.003978580446027203 },
    },
  },
  home: {
    mobile: {
      position: { x: -2.587733289456067, y: 2.043186556906539, z: 6.138063034027582 },
      rotation: { x: -0.2314870085266868, y: -0.29278159007086124, z: -0.06792585177631612 },
    },
    desktop: {
      position: { x: -0.034203410629448434, y: 1.2267996112598016, z: 3.6977443998667225 },
      rotation: { x: -0.21248504785893402, y: -0.012491264825962377, z: -0.002694810971032839 },
    },
  },
  projects: {
    mobile: {
      position: { x: 0.06933062203275325, y: 0.6629138169329795, z: 4.7045783826839935 },
      rotation: { x: -0.01984935320117561, y: 0.007846555450075657, z: 0.00015576790897335556 },
    },
    desktop: {
      position: { x: 0.7317772764108991, y: 1.0346202518946779, z: 0.8078307272048384 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  },
  contact: {
    mobile: {
      position: { x: -0.026561758159189663, y: 0.9930736776367304, z: 1.520812504324916 },
      rotation: { x: -0.18287106866911665, y: -0.009686604449170093, z: -0.001791383823006646 },
    },
    desktop: {
      position: { x: -0.014080253455143561, y: 0.8656767589002491, z: 0.3801748125186579 },
      rotation: { x: -0.09037316641352619, y: -0.0018096685636522448, z: -0.00016399208883666885 },
    },
  },
}

/* -------------------------------------------------------------------------- */
/*                                 experience                                 */
/* -------------------------------------------------------------------------- */
const Particles = forwardRef<ExperienceRef, ExperienceProps>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const params = useRef({ opacity: 1 })

  const particlesGeometryRef = useRef<InstancedBufferGeometry | null>(null)
  const particlesUniforms = useRef({
    u_time: { value: 0 },
    u_opacity: { value: 0 },
  })

  /* -------------------------------- functions ------------------------------- */
  const loadItems = () => {}

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
    params: params.current,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    particlesUniforms.current.u_time.value += delta * params.current.opacity
    particlesUniforms.current.u_opacity.value = params.current.opacity
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
      instancePositions[i3 + 0] = randFloat(-4, 2)
      instancePositions[i3 + 1] = 2.5
      instancePositions[i3 + 2] = randFloat(-4, 10)

      instanceRands[i] = randFloat(0, 5)
      instanceOpacity[i] = randFloat(0.2, 0.6)
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

const Dirt = forwardRef<ExperienceRef, ExperienceProps>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const params = useRef({ opacity: 1 })

  // scene
  const dirtMeshRef = useRef<Mesh<InstancedBufferGeometry, ShaderMaterial> | null>(null)
  const dirtUniformsRef = useRef({
    u_time: { value: 0 },
    u_opacity: { value: 1 },

    u_offsetTexture: { value: null as DataTexture | null },
  })

  // constants
  const DIRT_COUNT = useRef(16384)

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
    params: params.current,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    dirtUniformsRef.current.u_time.value += delta

    if (dirtMeshRef.current) dirtMeshRef.current.visible = params.current.opacity >= 0.9

    // update position
    dirtMeshRef.current?.position.setZ(-2)
    dirtMeshRef.current?.scale.setScalar(8)

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
          raycast={props.raycast}
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

const Ground = forwardRef<ExperienceRef, ExperienceProps>((props, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const params = useRef({ opacity: 1 })

  // load
  const floorBakedTexture = useRef<Texture | null>(null)

  // scene
  const groundUniforms = useRef({
    u_time: { value: 0 },
    u_color: { value: new Color(0xffffff) },
    u_texture: { value: null },
    u_textureMatrix: { value: null },

    u_scale: { value: 3.0 },
    u_stageLightRatio: { value: 1 },
    u_stageLightColor: { value: new Color("#ffffff") },

    u_shadowTexture: { value: null as Texture | null },
    u_maskTexture: { value: null as Texture | null },

    ...UniformsLib.fog,
  })

  // ui
  const projectsUI = useRef(document.getElementById(projectsSectionId))
  const projectsIndividualUI = useRef<HTMLElement[]>([])

  // params
  const projectHideY = useRef(0)
  const currColor = useRef(new Color())
  const prevColor = useRef(new Color())

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    // mix ratio
    let ratio = 0
    let index = 0
    projectsIndividualUI.current.forEach((el, i) => {
      if (window.scrollY > el.offsetTop) {
        index = i
      }
    })

    // get ratio
    const bounds = projectsIndividualUI.current[index]?.getBoundingClientRect()
    ratio = MathUtils.fit(bounds?.top || 0, 0, -(bounds?.height || 0) * 0.2, 0, 1)

    // set light show ratio
    const lightHideRatio = MathUtils.fit(bounds?.top || 0, 0, -(bounds?.height || 0) * 0.1, 1, 0)
    const lightShowRatio = MathUtils.fit(
      bounds?.top || 0,
      -(bounds?.height || 0) * 0.1,
      -(bounds?.height || 0) * 0.2,
      0,
      1
    )

    groundUniforms.current.u_stageLightRatio.value = params.current.opacity * (lightHideRatio + lightShowRatio)
    groundUniforms.current.u_time.value += delta

    // set stage color
    const prevIndex = index - 1

    // set color
    const screenHideRatio = MathUtils.fit(
      (window.scrollY - projectHideY.current) / Properties.viewportHeight,
      -1,
      0,
      0,
      1
    )
    if (screenHideRatio <= 0) {
      prevColor.current.set(prevIndex < 0 ? "#ffffff" : Projects[prevIndex].colorTop)
      currColor.current.set(Projects[index].colorTop)
      groundUniforms.current.u_stageLightColor.value.lerpColors(prevColor.current, currColor.current, ratio)
    } else {
      prevColor.current.set(Projects[index].colorTop)
      currColor.current.set("#ffffff")
      groundUniforms.current.u_stageLightColor.value.lerpColors(prevColor.current, currColor.current, ratio)
    }
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

    loader.add("/textures/floor.jpg", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.wrapS = RepeatWrapping
        tex.wrapT = RepeatWrapping

        groundUniforms.current.u_maskTexture.value = tex
      },
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
    params: params.current,
  }))

  /* --------------------------------- effects -------------------------------- */
  // setup UI
  useEffect(() => {
    projectsUI.current = document.getElementById(projectsSectionId)
    projectsIndividualUI.current = []

    Array.from(projectsUI.current?.children || []).forEach((_el) => {
      const el = _el as HTMLElement

      projectsIndividualUI.current.push(el)

      projectHideY.current = Math.max(projectHideY.current, el.offsetTop + el.offsetHeight)
    })
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <reflector rotation={[Math.PI * -0.5, 0, 0]} position={[0, 0.01, 0]} scale={[3, 3, 3]}>
          <planeGeometry args={[12, 12]} />
          <shaderMaterial
            uniforms={groundUniforms.current}
            vertexShader={groundVert}
            fragmentShader={groundFrag}
            transparent
          />
        </reflector>
      </group>
    )
  )
})
Ground.displayName = "Ground"

const Stage = forwardRef<ExperienceRef, ExperienceProps>((props, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const params = useRef({ opacity: 1 })

  // scene
  const floorGeometryRef = useRef<BufferGeometry | null>(null)
  const screenLeftGeometryRef = useRef<BufferGeometry | null>(null)
  const screenRightGeometryRef = useRef<BufferGeometry | null>(null)

  const screenLeftMeshRef = useRef<Mesh | null>(null)
  const screenRightMeshRef = useRef<Mesh | null>(null)

  const floorUniforms = useRef({
    u_scale: { value: 0.1 },
    u_time: { value: 0 },

    u_showRatio: { value: 1 },

    // color
    color_top: { value: new Color(0x000000) },
    color_bottom: { value: new Color(0x000000) },

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
    u_hideRatio: { value: 0 },

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

  const splitOffset = useRef(0)
  const projectHideY = useRef(0)
  const currColor = useRef(new Color())
  const prevColor = useRef(new Color())

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

    Projects.forEach((project, i) => {
      if (project.imageUrl) {
        loader.add(project.imageUrl, ItemType.Texture, {
          onLoad: (_tex) => {
            const tex = _tex as Texture
            tex.flipY = true

            screenUniforms.current.u_texture.value = tex
            projectTextures.current[i] = tex
          },
        })
      }

      if (project.videoUrl) {
        loader.add(project.videoUrl, ItemType.VideoTexture, {
          onLoad: (_tex) => {
            const tex = _tex as Texture

            screenUniforms.current.u_texture.value = tex
            projectTextures.current[i] = tex
          },
        })
      }
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
    params: params.current,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    // pre update
    if (asPath !== "/") {
      screenLeftMeshRef.current?.position.setX(-splitOffset.current)
      screenRightMeshRef.current?.position.setX(splitOffset.current)

      return
    }

    const contactBounds = contactUI.current?.getBoundingClientRect()

    // show ratio
    floorUniforms.current.u_showRatio.value = params.current.opacity

    // black screen
    const screenHideRatio = MathUtils.fit(
      (window.scrollY - projectHideY.current) / Properties.viewportHeight,
      -1,
      0,
      0,
      1
    )
    screenUniforms.current.u_hideRatio.value = screenHideRatio + (1 - params.current.opacity)

    // mix ratio
    let ratio = 0
    let index = 0
    projectsIndividualUI.current.forEach((el, i) => {
      if (window.scrollY > el.offsetTop) {
        index = i
      }
    })

    if (index <= projectTextures.current.length - 1) {
      // set texture
      screenUniforms.current.u_texture.value =
        index <= 0 ? projectTextures.current[0] : projectTextures.current[index - 1]
      screenUniforms.current.u_texture2.value = projectTextures.current[index]

      // get ratio
      const bounds = projectsIndividualUI.current[index]?.getBoundingClientRect()
      ratio = MathUtils.fit(bounds?.top || 0, 0, -(bounds?.height || 0) * 0.2, 0, 1)
    }

    screenUniforms.current.u_mixRatio.value = ratio

    // set stage color
    const prevIndex = index - 1

    if (screenHideRatio <= 0) {
      // set color top
      prevColor.current.set(prevIndex < 0 ? "#999999" : Projects[prevIndex].colorTop)
      currColor.current.set(Projects[index].colorTop)
      floorUniforms.current.color_top.value.lerpColors(prevColor.current, currColor.current, ratio)

      // set color bottom
      prevColor.current.set(prevIndex < 0 ? "#000000" : Projects[prevIndex].colorBottom)
      currColor.current.set(Projects[index].colorBottom)
      floorUniforms.current.color_bottom.value.lerpColors(prevColor.current, currColor.current, ratio)
    } else {
      // set color top
      prevColor.current.set(Projects[index].colorTop)
      currColor.current.set("#000000")
      floorUniforms.current.color_top.value.lerpColors(prevColor.current, currColor.current, screenHideRatio)

      // set color bottom
      prevColor.current.set(Projects[index].colorBottom)
      currColor.current.set("#000000")
      floorUniforms.current.color_bottom.value.lerpColors(prevColor.current, currColor.current, screenHideRatio)
    }

    // contact - move screen
    const contactTop = contactBounds?.top ?? 0
    const contactBottom = contactBounds?.bottom ?? 0
    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight
    const contactHideScreenOffset = -contactBottom / Properties.viewportHeight
    const contactSplitRatio = MathUtils.fit(contactShowScreenOffset, 1, 1.5, 0, 1, Quad.easeInOut)
    const contactUnSplitRatio = MathUtils.fit(contactHideScreenOffset, -1.5, -1, 0, -1, Quad.easeInOut)

    splitOffset.current = MathUtils.mix(contactSplitRatio + contactUnSplitRatio, 0, 0.5)

    screenLeftMeshRef.current?.position.setX(-splitOffset.current)
    screenRightMeshRef.current?.position.setX(splitOffset.current)

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
    homeUI.current = document.getElementById(homeSectionId)
    projectsUI.current = document.getElementById(projectsSectionId)
    projectsIndividualUI.current = []
    contactUI.current = document.getElementById(contactSectionId)

    Array.from(projectsUI.current?.children || []).forEach((_el) => {
      const el = _el as HTMLElement

      projectsIndividualUI.current.push(el)
      if (projectTextures.current.length <= 0) {
        projectTextures.current.push(null)
      }

      projectHideY.current = Math.max(projectHideY.current, el.offsetTop + el.offsetHeight)
    })
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        {/* floor */}
        <mesh geometry={floorGeometryRef.current ?? undefined} userData={{ reflect: false }} renderOrder={1}>
          <shaderMaterial
            uniforms={floorUniforms.current}
            vertexShader={stageVert}
            fragmentShader={stageFrag}
            transparent
          />
        </mesh>

        {/* screen */}
        <mesh ref={screenLeftMeshRef} geometry={screenLeftGeometryRef.current ?? undefined} renderOrder={11}>
          <shaderMaterial uniforms={screenUniforms.current} vertexShader={screenVert} fragmentShader={screenFrag} />
        </mesh>

        <mesh ref={screenRightMeshRef} geometry={screenRightGeometryRef.current ?? undefined} renderOrder={11}>
          <shaderMaterial uniforms={screenUniforms.current} vertexShader={screenVert} fragmentShader={screenFrag} />
        </mesh>

        {/* pointer mesh */}
        <mesh
          position={[0, 1, -3.2]}
          scale={[3.7, 2.12, 1]}
          visible={false}
          raycast={props.raycast}
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

const Contact = forwardRef<ExperienceRef, ExperienceProps>((props, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const params = useRef({
    opacity: 1,
    xLogoRandX: randFloat(0.2, 0.8),
    xLogoRandY: randFloat(0.2, 0.8),
    githubLogoRandX: randFloat(0.2, 0.8),
    githubLogoRandY: randFloat(0.2, 0.8),
  })
  const pointerVisible = useRef(true)

  // load
  const xLogoGeometryRef = useRef<BufferGeometry>()
  const githubLogoGeometryRef = useRef<BufferGeometry>()

  // scene
  const xLogoMeshRef = useRef<Group | null>(null)
  const githubLogoMeshRef = useRef<Group | null>(null)

  const xLogoUniformsRef = useRef({
    u_progress: { value: 0 },
  })

  const githubLogoUniformsRef = useRef({
    u_progress: { value: 0 },
  })

  // brownian
  const brownianMotion = useRef(new BrownianMotion())
  const tempVec3 = useRef(new Vector3())

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

  const update = (delta: number) => {
    if (asPath !== "/") {
      pointerVisible.current = false
      return
    }

    const contactBounds = contactUI.current?.getBoundingClientRect()

    // lerp
    const contactTop = contactBounds?.top ?? 0
    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight

    pointerVisible.current = contactShowScreenOffset > 2.3

    // - x
    let xRatio = MathUtils.fit(contactShowScreenOffset, 1.8, 2.1, 0, 1, Quad.easeInOut)
    let zRatio = MathUtils.fit(contactShowScreenOffset, 1.5, 1.8, 0, 1, Quad.easeInOut)
    xLogoMeshRef.current?.position.setX(MathUtils.mix(0, -0.5, xRatio))
    xLogoMeshRef.current?.position.setY(0.35)
    xLogoMeshRef.current?.position.setZ(MathUtils.mix(-4, -2.3, zRatio))
    xLogoUniformsRef.current.u_progress.value = MathUtils.fit(contactShowScreenOffset, 1.5, 2.1, 0, 1, Quad.easeInOut)

    // - github
    xRatio = MathUtils.fit(contactShowScreenOffset, 2.0, 2.3, 0, 1, Quad.easeInOut)
    zRatio = MathUtils.fit(contactShowScreenOffset, 1.7, 2.0, 0, 1, Quad.easeInOut)

    githubLogoMeshRef.current?.position.setX(MathUtils.mix(0, 0.5, xRatio))
    githubLogoMeshRef.current?.position.setY(0.35)
    githubLogoMeshRef.current?.position.setZ(MathUtils.mix(-5, -2.3, zRatio))
    githubLogoUniformsRef.current.u_progress.value = MathUtils.fit(
      contactShowScreenOffset,
      1.7,
      2.3,
      0,
      1,
      Quad.easeInOut
    )

    // float
    brownianMotion.current.update(delta)
    if (xLogoMeshRef.current) {
      // pre update
      tempVec3.current.copy(xLogoMeshRef.current.scale)
      xLogoMeshRef.current.scale.set(1, 1, 1)

      // update
      xLogoMeshRef.current.updateMatrix()
      xLogoMeshRef.current.matrix.multiply(brownianMotion.current.matrix)
      xLogoMeshRef.current.matrix.decompose(
        xLogoMeshRef.current.position,
        xLogoMeshRef.current.quaternion,
        xLogoMeshRef.current.scale
      )
      xLogoMeshRef.current.updateMatrixWorld()

      // post update
      xLogoMeshRef.current.scale.copy(tempVec3.current)
    }

    if (githubLogoMeshRef.current) {
      // pre update
      tempVec3.current.copy(githubLogoMeshRef.current.scale)
      githubLogoMeshRef.current.scale.set(1, 1, 1)

      // update
      githubLogoMeshRef.current.updateMatrix()
      githubLogoMeshRef.current.matrix.multiply(brownianMotion.current.matrix)
      githubLogoMeshRef.current.matrix.decompose(
        githubLogoMeshRef.current.position,
        githubLogoMeshRef.current.quaternion,
        githubLogoMeshRef.current.scale
      )
      githubLogoMeshRef.current.updateMatrixWorld()

      // post update
      githubLogoMeshRef.current.scale.copy(tempVec3.current)
    }

    // mouse interaction
    if (xLogoMeshRef.current) {
      xLogoMeshRef.current.rotation.x = -Input.mouseXY.y * 0.2 * params.current.xLogoRandX
      xLogoMeshRef.current.rotation.y = Input.mouseXY.x * 0.4 * params.current.xLogoRandY
    }

    if (githubLogoMeshRef.current) {
      githubLogoMeshRef.current.rotation.x = -Input.mouseXY.y * 0.2 * params.current.githubLogoRandX
      githubLogoMeshRef.current.rotation.y = Input.mouseXY.x * 0.4 * params.current.githubLogoRandY
    }

    // reset pointer
    if (contactShowScreenOffset <= 2.3) {
      document.body.style.cursor = "auto"
    }
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
    update,
    params: params.current,
  }))

  /* --------------------------------- effects -------------------------------- */
  // setup brownian motion
  useEffect(() => {
    brownianMotion.current.positionAmplitude = 0.2
    brownianMotion.current.rotationAmplitude = 0.0

    brownianMotion.current.positionFrequency = 0.1
    brownianMotion.current.rotationFrequency = 0.1
  }, [])

  // update UI
  useEffect(() => {
    contactUI.current = document.getElementById(contactSectionId)
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <group ref={xLogoMeshRef} position={[0, 0.35, -4]}>
          <mesh geometry={xLogoGeometryRef.current} renderOrder={1}>
            <shaderMaterial
              uniforms={xLogoUniformsRef.current}
              vertexShader={logoVert}
              fragmentShader={logoFrag}
              transparent
            />
          </mesh>

          {/* pointer mesh */}
          <mesh
            scale={[0.4, 0.4, 1]}
            visible={false}
            raycast={props.raycast}
            onPointerEnter={() => {
              if (pointerVisible.current) {
                document.body.style.cursor = "pointer"
              }
            }}
            onClick={() => {
              if (pointerVisible.current) {
                window.open(xURL, "_blank")
              }
            }}
            onPointerLeave={() => {
              if (pointerVisible.current) {
                document.body.style.cursor = "auto"
              }
            }}
          >
            <planeGeometry />
          </mesh>
        </group>

        <group ref={githubLogoMeshRef} position={[0, 0.35, -4]}>
          <mesh geometry={githubLogoGeometryRef.current} renderOrder={1}>
            <shaderMaterial
              uniforms={githubLogoUniformsRef.current}
              vertexShader={logoVert}
              fragmentShader={logoFrag}
              transparent
            />
          </mesh>

          {/* pointer mesh */}
          <mesh
            scale={[0.45, 0.45, 1]}
            visible={false}
            raycast={props.raycast}
            onPointerEnter={() => {
              if (pointerVisible.current) {
                document.body.style.cursor = "pointer"
              }
            }}
            onClick={() => {
              if (pointerVisible.current) {
                window.open(githubURL, "_blank")
              }
            }}
            onPointerLeave={() => {
              if (pointerVisible.current) {
                document.body.style.cursor = "auto"
              }
            }}
          >
            <planeGeometry />
          </mesh>
        </group>
      </group>
    )
  )
})
Contact.displayName = "Contact"

// eslint-disable-next-line react/no-unused-prop-types
export const HomeExperience = forwardRef<SceneHandle, HomeExperienceProps>((props, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- atoms --------------------------------- */
  const [, setEnableScroll] = useAtom(enableScrollAtom)
  const [, setPostAnimateIntroScene] = useAtom(postAnimateIntroSceneAtom)

  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(new PerspectiveCamera(45, 1, 0.1, 200))
  const raycast = useCamera(camera.current)

  // scene
  const particlesRef = useRef<ExperienceRef | null>(null)
  const dirtRef = useRef<ExperienceRef | null>(null)
  const groundRef = useRef<ExperienceRef | null>(null)
  const stageRef = useRef<ExperienceRef | null>(null)
  const contactRef = useRef<ExperienceRef | null>(null)

  // params
  const tempEuler = useRef(new Euler())
  const introComplete = useRef(false)
  const needsIntro = useRef(false)

  // ui
  const homeUI = useRef(document.getElementById(homeSectionId))
  const projectsUI = useRef(document.getElementById(projectsSectionId))
  const aboutUI = useRef(document.getElementById(aboutSectionId))
  const aboutIntroUI = useRef(document.getElementById(aboutIntroId))

  // brownian
  const brownianMotion = useRef(new BrownianMotion())
  const brownianParams = useRef({ progress: 0 })

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    camera.current.aspect = window.innerWidth / window.innerHeight
    camera.current.updateProjectionMatrix()

    // resize scenes
    particlesRef.current?.resize?.(window.innerWidth, window.innerHeight)
    dirtRef.current?.resize?.(window.innerWidth, window.innerHeight)
    groundRef.current?.resize?.(window.innerWidth, window.innerHeight)
    stageRef.current?.resize?.(window.innerWidth, window.innerHeight)
    contactRef.current?.resize?.(window.innerWidth, window.innerHeight)
  }

  const updateCamera = (delta: number) => {
    if (asPath !== "/" || !introComplete.current) {
      return
    }

    const homeBounds = homeUI.current?.getBoundingClientRect()
    const projectsBounds = projectsUI.current?.getBoundingClientRect()

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

    // contact
    const contactShowRatio = MathUtils.fit(projectsHideScreenOffset, -1, 0, 0, 1)

    // get camera
    let cameraPos: Vector3Like
    let cameraRot: Vector3Like
    const key = window.innerWidth < 768 ? "mobile" : "desktop"
    if (homeActive) {
      cameraPos = MathUtils.mixVec3(
        CameraPositions.home[key].position,
        CameraPositions.projects[key].position,
        projectsShowRatio
      )
      cameraRot = MathUtils.mixVec3(
        CameraPositions.home[key].rotation,
        CameraPositions.projects[key].rotation,
        projectsShowRatio
      )
    } else if (projectsActive) {
      cameraPos = MathUtils.mixVec3(
        CameraPositions.projects[key].position,
        CameraPositions.contact[key].position,
        contactShowRatio
      )
      cameraRot = MathUtils.mixVec3(
        CameraPositions.projects[key].rotation,
        CameraPositions.contact[key].rotation,
        contactShowRatio
      )
    } else {
      cameraPos = CameraPositions.contact[key].position
      cameraRot = CameraPositions.contact[key].rotation
    }

    // set camera
    camera.current.position.copy(cameraPos)

    tempEuler.current.set(cameraRot.x, cameraRot.y, cameraRot.z)
    camera.current.quaternion.setFromEuler(tempEuler.current)

    // float
    brownianParams.current.progress = lerp(brownianParams.current.progress, 1, 0.2)
    brownianMotion.current.update(delta * brownianParams.current.progress)
    camera.current.updateMatrix()
    camera.current.matrix.multiply(brownianMotion.current.matrix)
    camera.current.matrix.decompose(camera.current.position, camera.current.quaternion, camera.current.scale)
  }

  const reset = () => {
    const key = window.innerWidth < 768 ? "mobile" : "desktop"

    camera.current.position.copy(CameraPositions.intro[key].position)
    camera.current.rotation.set(
      CameraPositions.intro[key].rotation.x,
      CameraPositions.intro[key].rotation.y,
      CameraPositions.intro[key].rotation.z
    )

    if (dirtRef.current) dirtRef.current.params.opacity = 0
    if (particlesRef.current) particlesRef.current.params.opacity = 0
    if (groundRef.current) groundRef.current.params.opacity = 0
    if (stageRef.current) stageRef.current.params.opacity = 0
  }

  const introIn = () => {
    const key = window.innerWidth < 768 ? "mobile" : "desktop"
    gsap
      .timeline({
        onStart: () => {
          if (dirtRef.current) dirtRef.current.params.opacity = 0
          if (particlesRef.current) particlesRef.current.params.opacity = 0
          if (groundRef.current) groundRef.current.params.opacity = 0
          if (stageRef.current) stageRef.current.params.opacity = 0
        },
      })
      .to(
        camera.current.position,
        {
          x: CameraPositions.home[key].position.x,
          y: CameraPositions.home[key].position.y,
          z: CameraPositions.home[key].position.z,
          duration: 1.5,
          ease: "power1.inOut",
        },
        "<"
      )
      .to(
        camera.current.rotation,
        {
          x: CameraPositions.home[key].rotation.x,
          y: CameraPositions.home[key].rotation.y,
          z: CameraPositions.home[key].rotation.z,
          duration: 1.5,
          ease: "power1.inOut",
        },
        "<"
      )
      .add(() => {
        setEnableScroll(true)
        introComplete.current = true
        needsIntro.current = false

        setPostAnimateIntroScene(true)
      })
      .fromTo([stageRef.current?.params], { opacity: 0 }, { opacity: 1, duration: 5, ease: "power1.out" }, "-=0.5")
      .set([dirtRef.current?.params], { opacity: 1 }, "<")
      .fromTo([particlesRef.current?.params], { opacity: 0 }, { opacity: 1, duration: 2, ease: "power1.inOut" }, "<")
      .fromTo([groundRef.current?.params], { opacity: 0 }, { opacity: 1, duration: 1, ease: "power1.inOut" }, ">-1")
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    scene: () => scene.current,
    camera: () => camera.current,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    if (needsIntro.current && props.introIn.current) {
      introIn()
      needsIntro.current = false
    }

    updateCamera(delta)

    // update scene
    particlesRef.current?.update?.(delta)
    dirtRef.current?.update?.(delta)
    groundRef.current?.update?.(delta)
    stageRef.current?.update?.(delta)
    contactRef.current?.update?.(delta)

    // post update
    Input.postUpdate()
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

  // setup brownian motion
  useEffect(() => {
    brownianMotion.current.positionAmplitude = 0.026
    brownianMotion.current.rotationAmplitude = 0.02

    brownianMotion.current.positionFrequency = 0.3
    brownianMotion.current.rotationFrequency = 0.5

    brownianMotion.current._positionScale.multiplyScalar(0.1)
  }, [asPath, introComplete])

  // resize
  useEffect(() => {
    window.addEventListener("resize", resize)
    resize()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  // update UI
  useEffect(() => {
    if (asPath === "/") {
      needsIntro.current = true
      introComplete.current = false

      reset()
    }

    homeUI.current = document.getElementById(homeSectionId)
    projectsUI.current = document.getElementById(projectsSectionId)
    aboutUI.current = document.getElementById(aboutSectionId)
    aboutIntroUI.current = document.getElementById(aboutIntroId)
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return createPortal(
    <>
      {/* scene */}
      <Particles ref={particlesRef} show={props.show} raycast={raycast} />
      <Dirt ref={dirtRef} show={props.show} raycast={raycast} />
      <Ground ref={groundRef} show={props.show} raycast={raycast} />
      <Stage ref={stageRef} show={props.show} raycast={raycast} />
      <Contact ref={contactRef} show={props.show} raycast={raycast} />

      <fog args={[0x000000, 15, 25]} attach="fog" />
      <color attach="background" args={[0x4d4d4d]} />
    </>,
    scene.current
  )
})
HomeExperience.displayName = "HomeExperience"
