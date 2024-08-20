/* eslint-disable react/jsx-props-no-spreading */
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { AppProps } from "next/app"
import Head from "next/head"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { PerspectiveCamera } from "three"
import { r3f } from "../src/experience/Three"
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

const Scene = (props: { onEngineSetup: () => void }) => {
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

      <r3f.Out />
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
        <Scene onEngineSetup={() => setEngineSetup(true)} />
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
