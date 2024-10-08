/* eslint-disable react/jsx-props-no-spreading */
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { AnimatePresence, motion } from "framer-motion"
import gsap from "gsap"
import { Provider, useAtom } from "jotai"
import { ReactLenis, useLenis } from "lenis/dist/lenis-react"
import { AppProps } from "next/app"
import { Nunito } from "next/font/google"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import SplitType from "split-type"
import { Camera, LinearSRGBColorSpace, NoToneMapping, PerspectiveCamera, Scene, ShaderChunk } from "three"
import {
  animateIntroAtom,
  animateIntroSceneAtom,
  enableScrollAtom,
  postAnimateIntroSceneAtom,
  transitioningAtom,
} from "../src/atoms/sceneAtoms"
import { Navigations } from "../src/constants/uiConstants"
import { AboutScene } from "../src/experience/about/AboutScene"
import { FboHelper } from "../src/experience/FBOHelper"
import { HomeExperience } from "../src/experience/home/HomeScene"
import { Pass } from "../src/experience/Pass"
import { SceneHandle } from "../src/experience/types/SceneHandle"
import { AboutTransition } from "../src/passes/aboutTransition/aboutTransition"
import { OutputPass } from "../src/passes/outputPass/outputPass"
import lights from "../src/shaders/utils/lights.glsl"
import { Input } from "../src/utils/input"
import { Loader } from "../src/utils/loader"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

import "../styles/global.css"

/* -------------------------------------------------------------------------- */
/*                                    fonts                                   */
/* -------------------------------------------------------------------------- */
export const nunitoFont = Nunito({
  subsets: ["latin"],
  variable: "--nunito",
  display: "swap",
})

/* -------------------------------------------------------------------------- */
/*                                  constants                                 */
/* -------------------------------------------------------------------------- */
const headerTextId = "headerTextId"

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

const SceneRender = (props: { loader: Loader; preinitComplete: () => void; show: boolean }) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  // router
  const prevRoute = useRef<string | null>(null)

  // scenes
  const aboutSceneRef = useRef<SceneHandle | null>(null)
  const homeSceneRef = useRef<SceneHandle | null>(null)

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

  // params
  const transitioning = useRef(false)
  const needsTransition = useRef(false)
  const introIn = useRef(false)

  /* ---------------------------------- atom ---------------------------------- */
  const [, setAnimateIntro] = useAtom(animateIntroAtom)
  const [animateIntroScene] = useAtom(animateIntroSceneAtom)
  const [, setEnableScroll] = useAtom(enableScrollAtom)
  const [, setTransitioning] = useAtom(transitioningAtom)

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    aboutTransitionPass.current.resize(window.innerWidth, window.innerHeight)

    sceneRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
    fromRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
    toRenderTarget.current.setSize(window.innerWidth, window.innerHeight)
  }

  const toAboutTransition = useCallback(
    (fromRoute: string) => {
      if (!aboutTransitionPass.current.material) {
        return
      }

      aboutTransitionPass.current.reverse = false
      aboutTransitionPass.current.toRenderScene = aboutSceneRef.current?.scene()
      aboutTransitionPass.current.toRenderCamera = aboutSceneRef.current?.camera()
      passQueue.current.push(aboutTransitionPass.current)

      gsap
        .timeline({
          defaults: { duration: 2, ease: "power1.inOut" },
          onStart: () => {
            transitioning.current = true
          },
          onComplete: () => {
            transitioning.current = false
            setTransitioning(false)
            setEnableScroll(true)
          },
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
    },
    [setEnableScroll, setTransitioning]
  )

  const fromAboutTransition = useCallback(() => {
    if (!aboutTransitionPass.current.material) {
      return
    }

    aboutTransitionPass.current.reverse = true
    aboutTransitionPass.current.toRenderScene = homeSceneRef.current?.scene()
    aboutTransitionPass.current.toRenderCamera = homeSceneRef.current?.camera()
    passQueue.current.push(aboutTransitionPass.current)

    gsap
      .timeline({
        onStart: () => {
          transitioning.current = true
        },
        onComplete: () => {
          // update renders
          currRender.current = {
            scene: homeSceneRef.current?.scene(),
            camera: homeSceneRef.current?.camera(),
          }

          // update routes to update
          routesToUpdate.current.splice(routesToUpdate.current.indexOf("/world"), 1)

          // update passes
          const passIndex = passQueue.current.indexOf(aboutTransitionPass.current)
          passQueue.current.splice(passIndex, 1)

          // post update
          transitioning.current = false
          introIn.current = true
          setTransitioning(false)
        },
      })
      .fromTo(
        aboutTransitionPass.current.material.uniforms.u_progress,
        { value: 1 },
        { value: 0, duration: 1.5, ease: "power1.inOut" },
        "<"
      )
  }, [setTransitioning])

  const onRouteUpdated = () => {
    if (asPath === "/about") {
      toAboutTransition(prevRoute.current || "")
    } else if (prevRoute.current === "/about") {
      fromAboutTransition()
    }
    // intro
    else {
      setTransitioning(false)
    }

    routesToUpdate.current.push(asPath)
    prevRoute.current = asPath
  }

  /* --------------------------------- render --------------------------------- */
  // render
  useFrame(({ gl }) => {
    if (!currRender.current.scene || !currRender.current.camera) {
      return
    }

    // eslint-disable-next-line no-param-reassign
    gl.toneMapping = NoToneMapping
    // eslint-disable-next-line no-param-reassign
    gl.outputColorSpace = LinearSRGBColorSpace

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

    // transition
    if (!transitioning.current && needsTransition.current) {
      onRouteUpdated()

      // post update
      needsTransition.current = false
    }
  }, 1)

  /* --------------------------------- effects -------------------------------- */
  // setup initial scene
  useEffect(() => {
    switch (asPath) {
      case "/about":
        currRender.current.scene = aboutSceneRef.current?.scene()
        currRender.current.camera = aboutSceneRef.current?.camera()
        break
      case "/":
        currRender.current.scene = homeSceneRef.current?.scene()
        currRender.current.camera = homeSceneRef.current?.camera()
        break
      default:
        break
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // setup transition passes
  useEffect(() => {
    aboutTransitionPass.current.init(aboutSceneRef.current?.scene(), aboutSceneRef.current?.camera())

    outputPass.current.init()
    // passQueue.current.push(outputPass.current)
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
    introIn.current = false
    setEnableScroll(false)
    setTransitioning(true)

    if (transitioning.current) {
      needsTransition.current = true
      return
    }

    onRouteUpdated()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asPath])

  // initial UI intro
  useEffect(() => {
    if (props.show) {
      setAnimateIntro(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  // post UI intro - animate in scene
  useEffect(() => {
    if (animateIntroScene) {
      introIn.current = true
    }
  }, [animateIntroScene])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      <AboutScene ref={aboutSceneRef} introIn={introIn} />
      <HomeExperience
        ref={homeSceneRef}
        loader={props.loader}
        preinitComplete={props.preinitComplete}
        show={props.show}
        introIn={introIn}
      />
    </>
  )
}

const Experience = (props: {
  engineSetup: boolean
  onEngineSetup: () => void
  loader: Loader
  preinitComplete: () => void
  show: boolean
}) => {
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

      {props.engineSetup && (
        <SceneRender loader={props.loader} preinitComplete={props.preinitComplete} show={props.show} />
      )}
    </Canvas>
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

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div ref={containerRef} className={cn("z-[2]", "fixed inset-0")}>
      {/* bg */}
      <div className={cn("absolute inset-0", "pointer-events-none select-none", "bg-black")} />

      {/* content */}
      <div className={cn("relative h-full w-full", "flex flex-col items-center justify-center")}>
        {/* progress bar */}
        <div className={cn("h-[2px] w-1/4 max-w-[400px]", "rounded-full", "overflow-hidden")}>
          <div
            ref={progressBarRef}
            className={cn("h-full w-full", "rounded-[inherit]", "origin-center")}
            style={{
              background: "linear-gradient(90deg, #fff, #fff)",
              backgroundSize: "400px 20px",
              backgroundRepeat: "repeat",
              backgroundOrigin: "center",
            }}
          />
        </div>
      </div>
    </div>
  )
}

const Intro = () => {
  /* ---------------------------------- refs ---------------------------------- */
  // ui
  const introTitleRef = useRef<HTMLDivElement | null>(null)
  const introTitleShrinkRef = useRef<HTMLDivElement | null>(null)
  const introDescRef = useRef<HTMLDivElement | null>(null)

  const splittedTitleRef = useRef<SplitType | null>(null)
  const splittedDescriptionRef = useRef<SplitType | null>(null)

  // params
  const titleTopOffset = useRef(0)

  /* ---------------------------------- atoms --------------------------------- */
  const [animateIntro] = useAtom(animateIntroAtom)
  const [, setAnimateIntroScene] = useAtom(animateIntroSceneAtom)

  /* --------------------------------- effects -------------------------------- */
  // setup text
  useEffect(() => {
    if (introTitleRef.current) {
      splittedTitleRef.current?.revert()
      splittedTitleRef.current = new SplitType(introTitleRef.current, { types: "words" })

      // set position
      ;(splittedTitleRef.current.words ?? []).forEach((word) => {
        // eslint-disable-next-line no-param-reassign
        word.style.transform = "translate3d(0, 100%, 0)"
      })
    }

    if (introDescRef.current) {
      splittedDescriptionRef.current?.revert()
      splittedDescriptionRef.current = new SplitType(introDescRef.current, { types: "words" })

      // set position
      ;(splittedDescriptionRef.current.words ?? []).forEach((word) => {
        // eslint-disable-next-line no-param-reassign
        word.style.transform = "translate3d(0, -100%, 0)"
      })
    }
  }, [])

  // setup offsets
  useEffect(() => {
    // get variables
    const titleRect = introTitleRef.current?.getBoundingClientRect()
    const shrinkTitleRect = introTitleShrinkRef.current?.getBoundingClientRect()
    const finalTitleRect = document.getElementById(headerTextId)?.getBoundingClientRect()

    const titleHeight = titleRect?.height ?? 0
    const titleTop = titleRect?.top ?? 0
    const shrinkTitleHeight = shrinkTitleRect?.height ?? 0
    const finalTitleTop = finalTitleRect?.top ?? 0

    const heightOffset = titleHeight - shrinkTitleHeight
    const topOffset = titleTop + heightOffset * 0.5
    titleTopOffset.current = -topOffset + finalTitleTop
  }, [])

  // animate intro
  useEffect(() => {
    if (animateIntro) {
      gsap
        .timeline({})

        // animate in
        .to(splittedTitleRef.current?.words ?? [], { y: 0, stagger: 0.2, ease: "power1.inOut" })
        .to(splittedDescriptionRef.current?.words ?? [], { y: 0, stagger: 0.1, ease: "power1.inOut" }, "<0.15")

        // animate out
        .to(
          (splittedDescriptionRef.current?.words ?? []).slice(0, 2),
          { x: "-100vw", duration: 1, ease: "power1.inOut" },
          ">1"
        )
        .to(
          (splittedDescriptionRef.current?.words ?? []).slice(2),
          { x: "100vw", duration: 1, ease: "power1.inOut" },
          "<"
        )
        .add(() => {
          setAnimateIntroScene(true)
        }, "<")
        .to(
          introTitleRef.current,
          {
            y: `${titleTopOffset.current}px`,
            fontSize: "1rem",
            color: "#aaa",
            duration: 1,
            ease: "power1.inOut",
          },
          "<"
        )

        // swap header + title text
        .to(introTitleRef.current, { autoAlpha: 0, duration: 2 }, ">")
        .to(`#${headerTextId}`, { autoAlpha: 1, duration: 2 }, "<")
    }
  }, [animateIntro, setAnimateIntroScene])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div
      className={cn(
        "fixed inset-0",
        "min-h-[100vh]",
        "flex flex-col items-center justify-center",
        "pointer-events-none"
      )}
    >
      {/* title */}
      <div className="relative flex">
        <h2
          ref={introTitleRef}
          className={cn(
            "mb-[0]",
            "whitespace-pre font-heading text-[3rem] font-medium uppercase leading-[1] lg:text-[4.25rem]"
          )}
        >
          <div className="overflow-hidden">Sujen Phea</div>
        </h2>

        {/* mock text */}
        <div
          ref={introTitleShrinkRef}
          className={cn(
            "invisible opacity-0",
            "absolute bottom-0 left-1/2 -translate-x-1/2",
            "whitespace-pre font-heading text-[1rem] font-medium uppercase leading-[1]"
          )}
        >
          Sujen Phea
        </div>
      </div>

      {/* description */}
      <h4
        ref={introDescRef}
        className={cn("mb-[1.8rem] max-w-[40ch]", "text-[1.25rem] uppercase", "pointer-events-none select-none")}
      >
        <div className="overflow-hidden">Creative Web Developer</div>
      </h4>
    </div>
  )
}

const Navigation = () => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)

  /* ---------------------------------- atoms --------------------------------- */
  const [postAnimateIntroScene] = useAtom(postAnimateIntroSceneAtom)
  const [transitioning] = useAtom(transitioningAtom)

  /* --------------------------------- effects -------------------------------- */
  // animate
  useEffect(() => {
    if (!postAnimateIntroScene) {
      return
    }

    gsap.timeline().to(containerRef.current?.children ?? [], {
      translateX: transitioning ? "100%" : 0,
      stagger: 0.2,
      duration: 1,
      ease: "expo.inOut",
    })
  }, [postAnimateIntroScene, transitioning])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div
      ref={containerRef}
      className={cn("z-[1]", "fixed right-0 top-20 -translate-y-1/2 lg:top-1/2", "flex flex-col", "overflow-hidden")}
    >
      {Navigations.map((nav, i) => (
        <Link
          href={nav.url}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          scroll={false}
          className={cn("w-[180px] py-2", "flex items-center justify-end", "group overflow-hidden")}
          style={{
            transform: "translateX(100%)",
          }}
        >
          <p
            className={cn(
              "px-[1em]",
              "whitespace-nowrap text-xs uppercase",
              "select-none",
              "opacity-50 group-hover:translate-x-[20px] group-hover:opacity-100",
              asPath === nav.url && "translate-x-[20px] opacity-100",
              "[transition:transform_500ms_cubic-bezier(0.25,1,0.26,1),opacity_500ms_cubic-bezier(0.25,1,0.26,1)]"
            )}
            style={{
              textShadow: "0 0 5px rgba(150,150,150,0.8)",
            }}
          >
            {nav.label}
          </p>

          <div
            className={cn(
              "h-px w-[80px] bg-[#efefef]",
              "select-none",
              "opacity-20 group-hover:scale-x-50 group-hover:opacity-100",
              asPath === nav.url && "scale-x-50 opacity-100",
              "origin-right [transition:transform_400ms_cubic-bezier(0.67,0,0.57,1),opacity_400ms_cubic-bezier(0.67,0,0.57,1)]"
            )}
          />
        </Link>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   layout                                   */
/* -------------------------------------------------------------------------- */
const Layout = (props: { children: ReactNode }) => {
  const { asPath } = useRouter()
  const lenis = useLenis()

  /* ---------------------------------- refs ---------------------------------- */
  const sectionsToPreinit = useRef(1)
  const loader = useRef<Loader>(null!)

  /* ---------------------------------- atoms --------------------------------- */
  const [enableScroll] = useAtom(enableScrollAtom)

  /* --------------------------------- states --------------------------------- */
  const [engineSetup, setEngineSetup] = useState(false)

  // loader
  const [startLoader, setStartLoader] = useState(false)
  const [show, setShow] = useState(false)

  /* -------------------------------- functions ------------------------------- */
  const onPreinitComplete = () => {
    sectionsToPreinit.current -= 1

    if (sectionsToPreinit.current <= 0) {
      setStartLoader(true)
    }
  }

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    loader.current = new Loader(Properties.gl)
  }, [])

  // start/stop scroll
  useEffect(() => {
    if (enableScroll) {
      lenis?.resize()
      lenis?.start()
    } else {
      lenis?.stop()
    }
  }, [enableScroll, lenis])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* header */}
      <Head>
        <title>Sujen Phea</title>
        <meta name="theme-color" content="#000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="http://sujen.co/images/preview.png" />
        <meta name="twitter:creator" content="@sujen_p" />

        <meta property="og:title" content="Sujen Phea's Portfolio" />
        <meta property="og:description" content="A portfolio as a Creative Web Developer" />
        <meta property="og:image" content="http://sujen.co/images/preview.png" />
        <meta property="og:url" content="http://sujen.co" />
        <meta property="og:logo" content="http://sujen.co/favicon-32x32.png" />
        <meta property="og:type" content="website" />
      </Head>

      {/* loader */}
      {engineSetup && <Preloader loader={loader.current} startLoader={startLoader} onDismiss={() => setShow(true)} />}

      {/* scene */}
      <div className={cn("fixed inset-0 h-screen w-screen", "pointer-events-none select-none")}>
        <Experience
          engineSetup={engineSetup}
          onEngineSetup={() => setEngineSetup(true)}
          loader={loader.current}
          preinitComplete={onPreinitComplete}
          show={show}
        />
      </div>

      {/* header */}
      <div id={headerTextId} className={cn("opacity-0", "fixed left-1/2 top-8 -translate-x-1/2")}>
        <div className="text-[1rem] font-medium uppercase leading-[1] text-[#aaa]">Sujen Phea</div>
      </div>

      {/* navigation */}
      <Navigation />

      {/* intro */}
      {show && <Intro />}

      {/* main */}
      <ReactLenis root>
        {engineSetup && (
          <AnimatePresence initial={false}>
            <motion.main
              key={asPath}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="pointer-events-none relative"
            >
              {props.children}
            </motion.main>
          </AnimatePresence>
        )}
      </ReactLenis>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export default function App(props: AppProps) {
  return (
    <Provider>
      <Layout>
        <props.Component {...props.pageProps} />
      </Layout>
    </Provider>
  )
}
