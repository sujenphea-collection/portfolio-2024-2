import { OrbitControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import gsap from "gsap"
import Link from "next/link"
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import {
  AddEquation,
  CustomBlending,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NearestFilter,
  OneFactor,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  ZeroFactor,
} from "three"
import { clamp } from "three/src/math/MathUtils"
import { Three } from "../src/experience/Three"
import dirtFrag from "../src/shaders/dirt/dirtFrag.glsl"
import dirtVert from "../src/shaders/dirt/dirtVert.glsl"
import { Loader } from "../src/utils/loader"
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
  const DIRT_COUNT = useRef(4096)

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

const Experience = (props: { loader: Loader; preinitComplete: () => void; show: boolean }) => {
  /* ---------------------------------- refs ---------------------------------- */
  // ui
  const dirtRef = useRef<ExperienceRef | null>(null)

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    // resize scenes
    dirtRef.current?.resize?.(window.innerWidth, window.innerHeight)
  }

  /* --------------------------------- effects -------------------------------- */
  // load materials
  useEffect(() => {
    dirtRef.current?.loadItems(props.loader)

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

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* scene */}
      <Dirt ref={dirtRef} show={props.show} />

      <mesh rotation={[Math.PI * -0.5, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* /// */}
      <OrbitControls />
      {/* /// */}
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

  ///
  useEffect(() => {
    if (loaded) {
      props.onDismiss()

      gsap.to(containerRef.current, {
        autoAlpha: 0,
        duration: 0.5,
        delay: 0.2,
      })
    }
  }, [loaded, props])
  ///

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
