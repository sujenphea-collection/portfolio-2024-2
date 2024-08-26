/* eslint-disable react/jsx-props-no-spreading */
import { Text } from "@react-three/drei"
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber"
import { AppProps } from "next/app"
import Head from "next/head"
import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Camera, PerspectiveCamera, Scene, ShaderChunk } from "three"
import { FboHelper } from "../src/experience/FBOHelper"
import { Postprocessing } from "../src/experience/Postprocessing"
import lights from "../src/shaders/utils/lights.glsl"
import { Input } from "../src/utils/input"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

import "../styles/global.css"

/* -------------------------------------------------------------------------- */
/*                                    fonts                                   */
/* -------------------------------------------------------------------------- */
// export const drukWideFont = localFont({
//   src: [
//     { path: "../public/fonts/DrukWide-Medium-Trial.otf", weight: "400" },
//     { path: "../public/fonts/DrukWide-Bold-Trial.otf", weight: "600" },
//     { path: "../public/fonts/DrukWide-Heavy-Trial.otf", weight: "800" },
//   ],
//   variable: "--drukWide",
//   display: "swap",
// })

/* -------------------------------------------------------------------------- */
/*                                    test                                    */
/* -------------------------------------------------------------------------- */
type SceneHandle = {
  scene: () => Scene
  camera: () => Camera
}

const SceneOne = forwardRef<SceneHandle>((_, ref) => {
  const { camera: _camera } = useThree()

  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(_camera)

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    scene: () => scene.current,
    camera: () => camera.current,
  }))

  /* ---------------------------------- main ---------------------------------- */
  return createPortal(
    <group>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry />
        <meshBasicMaterial color={0x73eb93} />
      </mesh>

      <Text fontSize={0.5}>One</Text>

      <mesh position={[1.5, 0, 0]}>
        <torusKnotGeometry args={[0.5, 0.15, 64, 8, 2, 3]} />
        <meshNormalMaterial />
      </mesh>
    </group>,
    scene.current
  )
})
SceneOne.displayName = "SceneOne"

const SceneTwo = forwardRef<SceneHandle>((_, ref) => {
  const { camera: _camera } = useThree()

  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(_camera)

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    scene: () => scene.current,
    camera: () => camera.current,
  }))

  /* ---------------------------------- main ---------------------------------- */
  return createPortal(
    <group position={[0, 0, -1]}>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry />
        <meshBasicMaterial color={0x729be8} />
      </mesh>

      <Text fontSize={0.5}>Two</Text>

      <mesh position={[1.5, 0, 0]}>
        <torusKnotGeometry args={[0.5, 0.15, 64, 8, 2, 3]} />
        <meshStandardMaterial color={0x729be8} />
      </mesh>

      <pointLight position={[1.5, 3, 0]} intensity={10} />
      <pointLight position={[1.5, -3, 0]} intensity={10} />
      <ambientLight intensity={0.5} />
    </group>,
    scene.current
  )
})
SceneTwo.displayName = "SceneTwo"

/* -------------------------------------------------------------------------- */
/*                                 experience                                 */
/* -------------------------------------------------------------------------- */
const Setup = (props: { onEngineSetup: () => void }) => {
  const { camera, gl } = useThree()

  /* -------------------------------- callbacks ------------------------------- */
  const resize = useCallback(() => {
    const _camera = camera as PerspectiveCamera

    _camera.aspect = window.innerWidth / window.innerHeight
    _camera.updateProjectionMatrix()

    // update viewport size
    Properties.viewportWidth = window.innerWidth
    Properties.viewportHeight = window.innerHeight
  }, [camera])

  /* ---------------------------------- tick ---------------------------------- */
  useFrame((_, delta) => {
    Properties.deltaTime = delta
    Properties.time += delta
  })

  /* --------------------------------- effects -------------------------------- */
  // setup
  useEffect(() => {
    Properties.gl = gl
    Input.preInit()
    FboHelper.init(gl)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaderChunk = ShaderChunk as any
    shaderChunk.lights = lights

    props.onEngineSetup()
  }, [gl, props])

  // resize
  useEffect(() => {
    resize()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>
}

const SceneRender = (props: { postprocessing: Postprocessing }) => {
  /* ---------------------------------- refs ---------------------------------- */
  // scenes
  const sceneOneRef = useRef<SceneHandle | null>(null)
  const sceneTwoRef = useRef<SceneHandle | null>(null)

  // render
  const currRender = useRef<{ scene?: Scene; camera?: Camera }>({})

  /* --------------------------------- render --------------------------------- */
  // render
  useFrame(() => {
    if (currRender.current.scene && currRender.current.camera) {
      props.postprocessing.render(currRender.current.scene, currRender.current.camera)
    }
  }, 1)

  /* --------------------------------- effects -------------------------------- */
  // setup initial scene
  useEffect(() => {
    currRender.current.scene = sceneOneRef.current?.scene()
    currRender.current.camera = sceneOneRef.current?.camera()
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      <SceneOne ref={sceneOneRef} />
      <SceneTwo ref={sceneTwoRef} />
    </>
  )
}

const Experience = (props: { onEngineSetup: () => void }) => {
  const postprocessing = useRef(new Postprocessing())

  /* ---------------------------------- main ---------------------------------- */
  return (
    <Canvas
      camera={{
        fov: 45,
        aspect: 1,
        near: 0.1,
        far: 200,
      }}
    >
      <Setup onEngineSetup={props.onEngineSetup} />

      {/* <r3f.Out /> */}
      <SceneRender postprocessing={postprocessing.current} />
    </Canvas>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   layout                                   */
/* -------------------------------------------------------------------------- */
const Layout = (props: { children: ReactNode }) => {
  /* --------------------------------- states --------------------------------- */
  const [engineSetup, setEngineSetup] = useState(false)

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* header */}
      <Head>
        <title>Template</title>
      </Head>

      {/* scene */}
      <div className={cn("fixed inset-0 h-screen w-screen", "pointer-events-none select-none")}>
        <Experience onEngineSetup={() => setEngineSetup(true)} />
      </div>

      {/* main */}
      {engineSetup && <main className="pointer-events-none relative">{props.children}</main>}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export default function App(props: AppProps) {
  return (
    <Layout>
      <props.Component {...props.pageProps} />
    </Layout>
  )
}
