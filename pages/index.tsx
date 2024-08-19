import { useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import Link from "next/link"
import { useRouter } from "next/router"
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import {
  AddEquation,
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
  Quaternion,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsLib,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
  ZeroFactor,
} from "three"
import { clamp } from "three/src/math/MathUtils"
import { Three } from "../src/experience/Three"
import dirtFrag from "../src/shaders/dirt/dirtFrag.glsl"
import dirtVert from "../src/shaders/dirt/dirtVert.glsl"
import groundFrag from "../src/shaders/ground/groundFrag.glsl"
import groundVert from "../src/shaders/ground/groundVert.glsl"
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
    position: { x: -6.159406959102013, y: 5.536282269022624, z: 6.587827968025041 },
    rotation: { x: -0.7681781572206483, y: -0.7423109188375244, z: -0.5785537424927941 },
  },
  projects: {
    position: { x: -0.41792582937172246, y: 0.9159469228548319, z: 2.11393571000216 },
    rotation: { x: -0.09631061435150774, y: 0.0023820586763996427, z: 0.00023012929333132985 },
  },
}

/* -------------------------------------------------------------------------- */
/*                                 experience                                 */
/* -------------------------------------------------------------------------- */
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
    u_color: { value: new Color(0x7f7f7f) },
    u_texture: { value: renderTarget.current.texture },
    u_textureMatrix: { value: reflectorParams.current.textureMatrix },

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

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {})

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh
          ref={groundMesh}
          onBeforeRender={onReflectorBeforeRender}
          rotation={[Math.PI * -0.5, 0, 0]}
          position={[0, 0.01, 0]}
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
  const floorGeometryRef = useRef<BufferGeometry | null>(null)
  const floorBoxGeometryRef = useRef<BufferGeometry | null>(null)
  const screenGeometryRef = useRef<BufferGeometry | null>(null)

  const floorUniforms = useRef({
    u_scale: { value: 0.1 },
    u_time: { value: 0 },

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
    u_time: { value: 0 },
  })

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

    loader.add("/models/screen.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            screenGeometryRef.current = mesh.geometry as BufferGeometry
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
      },
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    screenUniforms.current.u_time.value += delta
    floorUniforms.current.u_time.value += delta
  })

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        {/* floor */}
        <mesh geometry={floorGeometryRef.current ?? undefined} userData={{ reflect: false }}>
          <shaderMaterial uniforms={floorUniforms.current} vertexShader={stageVert} fragmentShader={stageFrag} />
        </mesh>

        <mesh geometry={floorBoxGeometryRef.current ?? undefined} userData={{ reflect: false }}>
          <shaderMaterial uniforms={floorUniforms.current} vertexShader={stageVert} fragmentShader={stageFrag} />
        </mesh>

        {/* screen */}
        <mesh geometry={screenGeometryRef.current ?? undefined}>
          <shaderMaterial uniforms={screenUniforms.current} vertexShader={screenVert} fragmentShader={screenFrag} />
        </mesh>
      </group>
    )
  )
})
Stage.displayName = "Stage"

// eslint-disable-next-line react/no-unused-prop-types
const Experience = (props: { loader: Loader; preinitComplete: () => void; show: boolean }) => {
  const { camera } = useThree()
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  // ui
  const dirtRef = useRef<ExperienceRef | null>(null)
  const groundRef = useRef<ExperienceRef | null>(null)
  const stageRef = useRef<ExperienceRef | null>(null)

  // params
  const cameraParams = useRef({ position: CameraPositions.intro.position, rotation: CameraPositions.intro.rotation })
  const currQuaternion = useRef(new Quaternion())
  const endQuaternion = useRef(new Quaternion())
  const tempEuler = useRef(new Euler())

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    // resize scenes
    dirtRef.current?.resize?.(window.innerWidth, window.innerHeight)
    groundRef.current?.resize?.(window.innerWidth, window.innerHeight)
    stageRef.current?.resize?.(window.innerWidth, window.innerHeight)
  }

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {
    // update camera
    camera.position.lerp(cameraParams.current.position, 0.1)

    currQuaternion.current.slerp(endQuaternion.current, 0.1)
    camera.quaternion.copy(currQuaternion.current)
  })

  /* --------------------------------- effects -------------------------------- */
  // load materials
  useEffect(() => {
    dirtRef.current?.loadItems(props.loader)
    groundRef.current?.loadItems(props.loader)
    stageRef.current?.loadItems(props.loader)

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
    camera.position.copy(cameraParams.current.position)
    camera.rotation.set(
      cameraParams.current.rotation.x,
      cameraParams.current.rotation.y,
      cameraParams.current.rotation.z
    )
    camera.updateProjectionMatrix()
    currQuaternion.current.copy(camera.quaternion)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // update route
  useEffect(() => {
    if (asPath === "/projects") {
      cameraParams.current.position = CameraPositions.projects.position
      cameraParams.current.rotation = CameraPositions.projects.rotation
    } else {
      cameraParams.current.position = CameraPositions.intro.position
      cameraParams.current.rotation = CameraPositions.intro.rotation
    }

    // update end rotation
    const rotation = cameraParams.current.rotation
    tempEuler.current.set(rotation.x, rotation.y, rotation.z)
    endQuaternion.current.setFromEuler(tempEuler.current)
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* scene */}
      <Dirt ref={dirtRef} show={props.show} />
      <Ground ref={groundRef} show={props.show} />
      <Stage ref={stageRef} show={props.show} />

      <fog args={[0x0e0e1c, 15, 25]} attach="fog" />
      <color attach="background" args={[0x0e0e1c]} />
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
        <div className={cn("fixed right-10 top-10", "flex flex-col")}>
          <Link href="/projects" className="bg-white text-black">
            To Projects
          </Link>
          <Link href="/" className="bg-white text-black">
            To Home
          </Link>
        </div>
      </div>
    </>
  )
}
