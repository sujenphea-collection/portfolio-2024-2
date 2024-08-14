import { useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import Link from "next/link"
import { useRouter } from "next/router"
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { BufferGeometry, Euler, Group, LinearFilter, Mesh, Quaternion, RepeatWrapping, Texture, Vector2 } from "three"
import { Three } from "../src/experience/Three"
import screenFrag from "../src/shaders/screen/screenFrag.glsl"
import screenVert from "../src/shaders/screen/screenVert.glsl"
import stageFrag from "../src/shaders/stage/stageFrag.glsl"
import stageVert from "../src/shaders/stage/stageVert.glsl"
import { ItemType, Loader } from "../src/utils/loader"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
type ExperienceRef = {
  loadItmes: (loader: Loader) => void
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
const Ground = forwardRef<ExperienceRef, { show: boolean }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  // load
  const floorBakedTexture = useRef<Texture | null>(null)

  // scene
  const groundGeometryRef = useRef<BufferGeometry | null>(null)

  /* -------------------------------- functions ------------------------------- */
  const loadItems = (loader: Loader) => {
    loader.add("/models/ground.obj", ItemType.Obj, {
      onLoad: (obj) => {
        const group = obj as Group
        group.traverse((item) => {
          if (item.type === "Mesh") {
            const mesh = item as Mesh
            groundGeometryRef.current = mesh.geometry as BufferGeometry
          }
        })
      },
    })

    loader.add("/textures/floor-baked.jpg", ItemType.Texture, {
      onLoad: (_tex) => {
        const tex = _tex as Texture
        tex.flipY = true
        tex.minFilter = LinearFilter
        tex.magFilter = LinearFilter

        floorBakedTexture.current = tex
      },
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    loadItmes: loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {})

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        <mesh geometry={groundGeometryRef.current ?? undefined}>
          <meshBasicMaterial map={floorBakedTexture.current} />
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
    loadItmes: loadItems,
  }))

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    screenUniforms.current.u_time.value += delta
  })

  /* ---------------------------------- main ---------------------------------- */
  return (
    props.show && (
      <group>
        {/* floor */}
        <mesh geometry={floorGeometryRef.current ?? undefined}>
          <shaderMaterial uniforms={floorUniforms.current} vertexShader={stageVert} fragmentShader={stageFrag} />
        </mesh>

        <mesh geometry={floorBoxGeometryRef.current ?? undefined}>
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
    groundRef.current?.loadItmes(props.loader)
    stageRef.current?.loadItmes(props.loader)

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
      <Ground ref={groundRef} show={props.show} />
      <Stage ref={stageRef} show={props.show} />
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
