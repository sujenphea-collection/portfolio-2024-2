/* eslint-disable react/jsx-props-no-spreading */
import { Text } from "@react-three/drei"
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import { AppProps } from "next/app"
import Head from "next/head"
import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Camera, PerspectiveCamera, Scene, ShaderChunk } from "three"
import { FboHelper } from "../src/experience/FBOHelper"
import { Pass } from "../src/experience/Pass"
import { r3f } from "../src/experience/Three"
import { AboutTransition } from "../src/passes/aboutTransition/aboutTransition"
import { OutputPass } from "../src/passes/outputPass/outputPass"
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

const AboutScene = forwardRef<SceneHandle>((_, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(new PerspectiveCamera(45, 1, 0.1, 200))

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    camera.current.position.set(0, 0, 5)
    camera.current.aspect = window.innerWidth / window.innerHeight
    camera.current.updateProjectionMatrix()
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    scene: () => scene.current,
    camera: () => camera.current,
  }))

  /* --------------------------------- effects -------------------------------- */
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
AboutScene.displayName = "AboutScene"

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
    Properties.globalUniforms.u_deltaTime.value = delta

    Properties.time += delta
    Properties.globalUniforms.u_time.value += delta
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

const SceneRender = () => {
  const { camera } = useThree()

  /* ---------------------------------- refs ---------------------------------- */
  // scenes
  const aboutSceneRef = useRef<SceneHandle | null>(null)
  const homeScene = useRef(new Scene())

  // passes
  const aboutTransitionPass = useRef(new AboutTransition())
  const outputPass = useRef(new OutputPass())
  const passQueue = useRef<Pass[]>([])

  // render
  const currRender = useRef<{ scene?: Scene; camera?: Camera }>({})
  const routesToUpdate = useRef<string[]>([])

  // render targets
  const sceneRenderTarget = useRef(FboHelper.createRenderTarget(1, 1))
  const fromRenderTarget = useRef(FboHelper.createRenderTarget(1, 1))
  const toRenderTarget = useRef(FboHelper.createRenderTarget(1, 1))

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    aboutTransitionPass.current.resize(window.innerWidth, window.innerHeight)

    sceneRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
    fromRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
    toRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
  }

  const toAboutTransition = useCallback((fromRoute: string) => {
    if (!aboutTransitionPass.current.material) {
      return
    }

    aboutTransitionPass.current.reverse = false
    aboutTransitionPass.current.toRenderScene = aboutSceneRef.current?.scene()
    aboutTransitionPass.current.toRenderCamera = aboutSceneRef.current?.camera()
    passQueue.current.push(aboutTransitionPass.current)

    gsap
      .timeline({
        defaults: { duration: 3, ease: "expo.inOut" },
      })
      .fromTo(aboutTransitionPass.current.material.uniforms.u_progress, { value: 0 }, { value: 1 }, "<")
      .call(
        () => {
          // update renders
          currRender.current = {
            scene: aboutSceneRef.current?.scene(),
            camera: aboutSceneRef.current?.camera(),
          }
        },
        undefined,
        ">"
      )
      .call(
        () => {
          // update routes to update
          routesToUpdate.current.splice(routesToUpdate.current.indexOf(fromRoute), 1)

          // update passes
          const passIndex = passQueue.current.indexOf(aboutTransitionPass.current)
          passQueue.current.splice(passIndex, 1)
        },
        undefined,
        "+=0.1"
      )
  }, [])

  /* --------------------------------- render --------------------------------- */
  // render
  useFrame(({ gl }) => {
    if (!currRender.current.scene || !currRender.current.camera) {
      return
    }

    const sortedQueue = passQueue.current
      .filter((q) => q.enabled)
      .sort((x: Pass, y: Pass) => {
        return x.renderOrder === y.renderOrder ? 0 : x.renderOrder - y.renderOrder
      })

    if (sortedQueue.length > 0) {
      // render current scene
      gl.setRenderTarget(fromRenderTarget.current)
      gl.render(currRender.current.scene, currRender.current.camera)

      // use texture in pass
      sortedQueue.forEach((pass, i, arr) => {
        pass.render(
          fromRenderTarget.current.texture,
          toRenderTarget.current,
          currRender.current.camera!,
          i === arr.length - 1
        )

        const temp = fromRenderTarget.current
        fromRenderTarget.current = toRenderTarget.current
        toRenderTarget.current = temp
      })
    } else {
      gl.setRenderTarget(null)
      gl.render(currRender.current.scene, currRender.current.camera)
    }
  }, 1)

  /* --------------------------------- effects -------------------------------- */
  // setup initial scene
  useEffect(() => {
    currRender.current.scene = homeScene.current
    currRender.current.camera = camera

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // setup transition passes
  useEffect(() => {
    aboutTransitionPass.current.init(aboutSceneRef.current?.scene(), aboutSceneRef.current?.camera())

    outputPass.current.init()
    passQueue.current.push(outputPass.current)
  }, [])

  // resize
  useEffect(() => {
    resize()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // transition
  useEffect(() => {
    setTimeout(() => {
      toAboutTransition("")
    }, 2e3)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      <AboutScene ref={aboutSceneRef} />

      {createPortal(<r3f.Out />, homeScene.current)}
    </>
  )
}

const Experience = (props: { onEngineSetup: () => void }) => {
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

      <SceneRender />
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
