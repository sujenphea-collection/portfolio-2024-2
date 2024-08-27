import gsap from "gsap"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  aboutContentId,
  aboutIntroId,
  aboutSectionId,
  basePadding,
  contactSectionId,
  homeSectionId,
  projectsSectionId,
} from "../src/constants/uiConstants"
import { HomeExperience } from "../src/experience/home/HomeExperience"
import { Three } from "../src/experience/Three"
import { Loader } from "../src/utils/loader"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

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
        <HomeExperience loader={loader.current} preinitComplete={onPreinitComplete} show={show} />
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
