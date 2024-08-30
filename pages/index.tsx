import { useLenis } from "lenis/dist/lenis-react"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { basePadding, contactSectionId, homeSectionId, projectsSectionId } from "../src/constants/uiConstants"
import Ease from "../src/utils/ease"
import { MathUtils } from "../src/utils/math"
import { Properties } from "../src/utils/properties"
import { cn } from "../src/utils/utils"

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
type ComponentRef = {
  update: (delta: number) => void
  resize?: (width: number, height: number) => void
}

/* -------------------------------------------------------------------------- */
/*                                 components                                 */
/* -------------------------------------------------------------------------- */
const ContactSection = forwardRef<ComponentRef>((_, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLDivElement | null>(null)

  /* -------------------------------- functions ------------------------------- */
  const update = () => {
    const contactBounds = containerRef.current?.getBoundingClientRect()
    const contactTop = contactBounds?.top ?? 0
    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight

    const showRatio = MathUtils.fit(contactShowScreenOffset, 1.5, 2, 0, 1, Ease.cubicOut)
    if (titleRef.current) {
      const offsetY = (1 - showRatio) * 100
      titleRef.current.style.transform = `translateY(${offsetY}%)`
    }

    if (contentRef.current) {
      contentRef.current.style.visibility = contactShowScreenOffset > 0 ? "visible" : "hidden"
    }
  }

  /* --------------------------------- scroll --------------------------------- */
  useLenis(() => {
    // called every scroll
    const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0

    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-containerTop}px)`
    }
  })

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    update,
  }))

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div ref={containerRef} id={contactSectionId} className="pb-[250vh]">
      <div
        ref={contentRef}
        className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}
      >
        <div
          className={cn("absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2", "flex flex-col items-start")}
        >
          {/* title */}
          <div className={cn("mb-[1.5rem]", "overflow-hidden")}>
            <h2 ref={titleRef} className={cn("whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}>
              Contact
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
})
ContactSection.displayName = "ContactSection"

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export default function Home() {
  /* ---------------------------------- refs ---------------------------------- */
  const contactRef = useRef<ComponentRef | null>(null)

  const dateTime = useRef(performance.now())

  /* --------------------------------- effects -------------------------------- */
  // setup raf
  useEffect(() => {
    const loop = () => {
      window.requestAnimationFrame(loop)

      const a = performance.now()
      let e = (a - dateTime.current) / 1e3
      dateTime.current = a
      e = Math.min(e, 1 / 20)

      contactRef.current?.update(e)
    }

    window.requestAnimationFrame(loop)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <>
      {/* content */}
      <div className="relative">
        {/* home */}
        <div id={homeSectionId} className="pb-[100vh]" />

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

        {/* contact */}
        <ContactSection ref={contactRef} />
      </div>
    </>
  )
}
