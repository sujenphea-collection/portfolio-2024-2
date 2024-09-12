import { useLenis } from "lenis/dist/lenis-react"
import { useRouter } from "next/router"
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
/*                                  constans                                  */
/* -------------------------------------------------------------------------- */
const Projects = [
  { title: "Project 1", description: "Description", link: "https://google.com" },
  { title: "Project 2", description: "Description", link: "https://google.com" },
  { title: "Project 3", description: "Description", link: "https://google.com" },
]

/* -------------------------------------------------------------------------- */
/*                                 components                                 */
/* -------------------------------------------------------------------------- */
const ProjectsSection = forwardRef<ComponentRef>((_, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)

  const titles = useRef<{ [key: number]: HTMLElement }>({})
  const descs = useRef<{ [key: number]: HTMLElement }>({})

  /* -------------------------------- functions ------------------------------- */
  const update = () => {
    Array.from(containerRef.current?.children ?? []).forEach((el, i) => {
      const content = el as HTMLElement
      const bounds = content.getBoundingClientRect()

      const showScreenOffset = (Properties.viewportHeight - bounds.top) / Properties.viewportHeight
      const hideScreenOffset = -bounds.bottom / Properties.viewportHeight

      content.style.visibility = showScreenOffset > 0 && hideScreenOffset < 0 ? "visible" : "hidden"

      // animate title
      const titleShowRatio = MathUtils.fit(showScreenOffset, 1, 1.5, 0, 1, Ease.cubicOut)
      const titleHideRatio = MathUtils.fit(hideScreenOffset, -0.8, -0.3, 0, 1, Ease.cubicIn)
      titles.current[i].style.transform = `translateY(${(1 - titleShowRatio + titleHideRatio) * 100}%)`

      // animate description
      const descShowRatio = MathUtils.fit(showScreenOffset, 1.2, 1.7, 0, 1, Ease.cubicOut)
      const descHideRatio = MathUtils.fit(hideScreenOffset, -0.6, -0.3, 0, 1, Ease.cubicIn)
      descs.current[i].style.transform = `translateY(${(1 - descShowRatio + descHideRatio) * 100}%)`
    })
  }

  /* --------------------------------- scroll --------------------------------- */
  useLenis(() => {
    Array.from(containerRef.current?.children ?? []).forEach((el) => {
      const container = el as HTMLElement
      const content = el.children[0] as HTMLElement

      const containerTop = container.getBoundingClientRect().top
      content.style.transform = `translateY(${-containerTop}px)`
    })
  })

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    update,
  }))

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    Array.from(containerRef.current?.children ?? []).forEach((el, i) => {
      const title = el.getElementsByClassName("title")[0] as HTMLElement
      titles.current[i] = title

      const desc = el.getElementsByClassName("desc")[0] as HTMLElement
      descs.current[i] = desc
    })
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div ref={containerRef} id={projectsSectionId}>
      {Projects.map((project, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="pb-[150vh]">
          <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
            <div
              className={cn(
                "lg:absolute lg:left-[70%] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
                "flex flex-col items-start"
              )}
            >
              {/* title */}
              <div
                className={cn(
                  "lg:static",
                  "absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0",
                  "mb-[1.5rem]",
                  "overflow-hidden"
                )}
              >
                <h2 className={cn("title", "whitespace-pre font-heading text-[4.25rem] font-medium leading-[1.3]")}>
                  {project.title}
                </h2>
              </div>

              {/* description */}
              <div
                className={cn(
                  "lg:static",
                  "absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0",
                  "overflow-hidden"
                )}
              >
                <h4 className={cn("desc", "max-w-[40ch]", "text-[1.25rem]")}>{project.description}</h4>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
ProjectsSection.displayName = "ProjectsSection"

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
  const projectsRef = useRef<ComponentRef | null>(null)

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
      projectsRef.current?.update(e)
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
        <ProjectsSection ref={projectsRef} />

        {/* contact */}
        <ContactSection ref={contactRef} />
      </div>
    </>
  )
}
