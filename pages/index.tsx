import { useLenis } from "lenis/dist/lenis-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Icon } from "../src/components/Icon"
import { Projects } from "../src/constants/projects"
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
      if (titles.current[i]) {
        titles.current[i].style.transform = `translateY(${(1 - titleShowRatio + titleHideRatio) * 100}%)`
      }

      // animate description
      const descShowRatio = MathUtils.fit(showScreenOffset, 1.2, 1.7, 0, 1, Ease.cubicOut)
      const descHideRatio = MathUtils.fit(hideScreenOffset, -0.6, -0.3, 0, 1, Ease.cubicIn)
      if (descs.current[i]) {
        descs.current[i].style.transform = `translateY(${(1 - descShowRatio + descHideRatio) * 100}%)`
      }
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

    update()
  })

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    update: () => {},
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
    <div ref={containerRef} id={projectsSectionId} className={cn("select-none")}>
      {Projects.map((project, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={cn("pb-[150vh]")}>
          <div className={cn("relative min-h-[100vh]", basePadding, "flex flex-col items-center justify-center")}>
            <div
              className={cn(
                "absolute left-[70%] top-1/2 -translate-x-1/2 -translate-y-1/2",
                "hidden flex-col items-start lg:flex"
              )}
            >
              {/* title */}
              <Link
                href={project.link}
                target="_blank"
                className={cn(
                  "lg:static",
                  "absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0",
                  "group overflow-hidden"
                )}
              >
                {/* underline */}
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-px",
                    "border-b-4 border-contentColor",
                    "origin-left scale-x-0 group-hover:scale-x-100",
                    "transition-transform duration-500 ease-in-out will-change-transform"
                  )}
                />

                {/* content */}
                <h2
                  className={cn(
                    "title",
                    "relative whitespace-pre font-heading text-[4.25rem] font-medium leading-[1.3]"
                  )}
                >
                  {project.title}
                </h2>
              </Link>

              {/* description */}
              <div
                className={cn(
                  "lg:static",
                  "mt-[0.5rem]",
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

const ProjectsMobileSection = forwardRef<ComponentRef>((_, ref) => {
  const { asPath } = useRouter()

  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)

  const titles = useRef<{ [key: number]: HTMLElement }>({})
  const descs = useRef<{ [key: number]: HTMLElement }>({})

  // ui
  const projectsUI = useRef(document.getElementById(projectsSectionId))
  const projectsIndividualUI = useRef<HTMLElement[]>([])

  /* -------------------------------- functions ------------------------------- */
  const update = () => {
    projectsIndividualUI.current.forEach((el, i) => {
      const content = el as HTMLElement
      const bounds = content.getBoundingClientRect()

      const showScreenOffset = (Properties.viewportHeight - bounds.top) / Properties.viewportHeight
      const hideScreenOffset = -bounds.bottom / Properties.viewportHeight

      content.style.pointerEvents = showScreenOffset > 0 && hideScreenOffset < 0 ? "auto" : "none"
      content.style.visibility = showScreenOffset > 0 && hideScreenOffset < 0 ? "visible" : "hidden"

      // animate title
      const titleShowRatio = MathUtils.fit(showScreenOffset, 1, 1.5, 0, 1, Ease.cubicOut)
      const titleHideRatio = MathUtils.fit(hideScreenOffset, -0.8, -0.3, 0, 1, Ease.cubicIn)
      if (titles.current[i]) {
        titles.current[i].style.transform = `translateY(${(1 - titleShowRatio + titleHideRatio) * 100}%)`
      }

      // animate description
      const descShowRatio = MathUtils.fit(showScreenOffset, 1.2, 1.7, 0, 1, Ease.cubicOut)
      const descHideRatio = MathUtils.fit(hideScreenOffset, -0.6, -0.3, 0, 1, Ease.cubicIn)
      if (descs.current[i]) {
        descs.current[i].style.transform = `translateY(${(1 - descShowRatio + descHideRatio) * 100}%)`
      }
    })
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    update,
  }))

  /* --------------------------------- effects -------------------------------- */
  useEffect(() => {
    // get title + desc
    Array.from(containerRef.current?.children ?? []).forEach((el, i) => {
      const title = el.getElementsByClassName("title")[0] as HTMLElement
      titles.current[i] = title

      const desc = el.getElementsByClassName("desc")[0] as HTMLElement
      descs.current[i] = desc
    })

    // get ui
    projectsUI.current = document.getElementById(projectsSectionId)
    projectsIndividualUI.current = []

    Array.from(projectsUI.current?.children || []).forEach((_el) => {
      const el = _el as HTMLElement

      projectsIndividualUI.current.push(el)
    })
  }, [asPath])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div ref={containerRef}>
      {Projects.map((project, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="fixed left-0 top-0 h-[100dvh] w-[100vw]">
          {/* title */}
          <Link
            href={project.link}
            target="_blank"
            className={cn(
              "lg:static",
              "absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2",
              "mb-[1.5rem]",
              "select-none overflow-hidden"
            )}
          >
            <div className={cn("title", "flex")}>
              <h2 className={cn("whitespace-pre font-heading text-[2.25rem] font-medium leading-[1.3]")}>
                {project.title}
              </h2>

              {/* arrow */}
              <Icon type="LeftArrow" className={cn("h-8 w-8", "-rotate-45")} />
            </div>
          </Link>

          {/* description */}
          <div
            className={cn(
              "lg:static",
              "absolute bottom-[0%] left-1/2 w-full -translate-x-1/2 -translate-y-1/2",
              "flex justify-center",
              "overflow-hidden"
            )}
          >
            <h4 className={cn("desc", "w-full max-w-[90%]", " text-center text-[1.25rem]")}>{project.description}</h4>
          </div>
        </div>
      ))}
    </div>
  )
})
ProjectsMobileSection.displayName = "ProjectsMobileSection"

const ProjectsContainerSection = forwardRef<ComponentRef>((_, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const mobileRef = useRef<ComponentRef | null>(null)
  const desktopRef = useRef<ComponentRef | null>(null)

  /* --------------------------------- states --------------------------------- */
  const [isMobile, setIsMobile] = useState(false)

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    update: (delta) => {
      mobileRef.current?.update(delta)
      desktopRef.current?.update(delta)
    },
  }))

  /* --------------------------------- effects -------------------------------- */
  // resize
  useEffect(() => {
    const resize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", resize)
    resize()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div>
      <ProjectsSection ref={desktopRef} />
      {isMobile && <ProjectsMobileSection ref={mobileRef} />}
    </div>
  )
})
ProjectsContainerSection.displayName = "ProjectsContainerSection"

const ContactSection = forwardRef<ComponentRef>((_, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLDivElement | null>(null)

  const mobileContainerRef = useRef<HTMLDivElement | null>(null)
  const titleMobileRef = useRef<HTMLDivElement | null>(null)

  /* -------------------------------- functions ------------------------------- */
  const update = () => {
    const contactBounds = containerRef.current?.getBoundingClientRect()
    const contactTop = contactBounds?.top ?? 0
    const contactBottom = contactBounds?.bottom ?? 0

    const contactShowScreenOffset = (Properties.viewportHeight - contactTop) / Properties.viewportHeight
    const contactHideScreenOffset = -contactBottom / Properties.viewportHeight

    if (mobileContainerRef.current) {
      mobileContainerRef.current.style.pointerEvents =
        contactShowScreenOffset > 0 && contactHideScreenOffset < 0 ? "auto" : "none"
      mobileContainerRef.current.style.visibility =
        contactShowScreenOffset > 0 && contactHideScreenOffset < 0 ? "visible" : "hidden"
    }

    const showRatio = MathUtils.fit(contactShowScreenOffset, 1.5, 2, 0, 1, Ease.cubicOut)
    if (titleRef.current) {
      const offsetY = (1 - showRatio) * 100
      titleRef.current.style.transform = `translateY(${offsetY}%)`
    }

    if (titleMobileRef.current) {
      const offsetY = (1 - showRatio) * 100
      titleMobileRef.current.style.transform = `translateY(${offsetY}%)`
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
    <div>
      {/* container */}
      <div ref={containerRef} id={contactSectionId} className="pb-[250vh]">
        <div
          ref={contentRef}
          className={cn("relative min-h-[100dvh]", basePadding, "flex flex-col items-center justify-center")}
        >
          <div
            className={cn(
              "absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2",
              "hidden flex-col items-start lg:flex"
            )}
          >
            {/* title */}
            <div className={cn("mb-[1.5rem]", "overflow-hidden")}>
              <h2
                ref={titleRef}
                className={cn("whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
              >
                Contact
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* mobile: content */}
      {/* // ios lags in transform */}
      <div
        ref={mobileContainerRef}
        className={cn("fixed left-1/2 top-[30dvh] -translate-x-1/2 -translate-y-1/2", "lg:hidden")}
      >
        {/* title */}
        <div className={cn("mb-[1.5rem]", "overflow-hidden")}>
          <h2
            ref={titleMobileRef}
            className={cn("whitespace-pre font-heading text-[4.25rem] font-medium leading-[100%]")}
          >
            Contact
          </h2>
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
        <ProjectsContainerSection ref={projectsRef} />

        {/* contact */}
        <ContactSection ref={contactRef} />
      </div>
    </>
  )
}
