import gsap from "gsap"
import { useAtom } from "jotai"
import { useEffect, useRef } from "react"
import SplitType from "split-type"
import { animateInSceneAtom } from "../src/atoms/sceneAtoms"
import { cn } from "../src/utils/utils"

export default function About() {
  /* ---------------------------------- refs ---------------------------------- */
  const lineTopRef = useRef<HTMLDivElement | null>(null)
  const lineBottomRef = useRef<HTMLDivElement | null>(null)
  const lineLeftRef = useRef<HTMLDivElement | null>(null)
  const lineRightRef = useRef<HTMLDivElement | null>(null)

  const descriptionRef = useRef<HTMLDivElement | null>(null)
  const splittedDescriptionRef = useRef<SplitType | null>(null)

  /* ---------------------------------- atoms --------------------------------- */
  const [animateIn] = useAtom(animateInSceneAtom)

  /* --------------------------------- effects -------------------------------- */
  // setup text
  useEffect(() => {
    if (descriptionRef.current) {
      splittedDescriptionRef.current?.revert()
      splittedDescriptionRef.current = new SplitType(descriptionRef.current, { types: "lines,words" })

      // set position
      ;(splittedDescriptionRef.current.lines ?? []).forEach((line) => {
        // eslint-disable-next-line no-param-reassign
        line.style.overflow = "hidden"
        // eslint-disable-next-line no-param-reassign
        line.style.padding = "10px 0"
      })
      ;(splittedDescriptionRef.current.words ?? []).forEach((word) => {
        // eslint-disable-next-line no-param-reassign
        word.style.transform = "translate3d(0, 100%, 0)"
        // eslint-disable-next-line no-param-reassign
        word.style.opacity = "0"
      })
    }
  }, [])

  // animate
  useEffect(() => {
    if (!animateIn) {
      return
    }

    gsap
      .timeline({ delay: 1 })
      .to(lineTopRef.current, { scaleX: 1, duration: 1 })
      .to(lineLeftRef.current, { scaleY: 1, duration: 1 }, "<0.1")
      .to(lineRightRef.current, { scaleY: 1, duration: 1 }, "<0.1")
      .to(
        splittedDescriptionRef.current?.words ?? [],
        {
          y: 0,
          stagger: 0.03,
          ease: "power1.inOut",
        },
        "<0.1"
      )
      .to(
        splittedDescriptionRef.current?.words ?? [],
        {
          opacity: 1,
          stagger: 0.04,
          ease: "power1.inOut",
        },
        "<0.1"
      )
      .to(lineBottomRef.current, { scaleX: 1, duration: 1 })
  }, [animateIn])

  /* ---------------------------------- main ---------------------------------- */
  return (
    <div className="relative">
      {/* screen 1 */}
      <div className="relative">
        {/* decoration */}
        <div className={cn("absolute inset-0", "pointer-events-none, select-none")}>
          {/* top */}
          <div
            ref={lineTopRef}
            className={cn(
              "absolute inset-x-0 top-5 h-px",
              "border-t border-[#343434]",
              "origin-left scale-x-0 overflow-hidden"
            )}
          />

          {/* bottom */}
          <div
            ref={lineBottomRef}
            className={cn(
              "absolute inset-x-0 bottom-5 h-px",
              "border-t border-[#343434]",
              "origin-left scale-x-0 overflow-hidden"
            )}
          />

          {/* left */}
          <div
            ref={lineLeftRef}
            className={cn(
              "absolute inset-y-0 left-5 w-px",
              "border-r border-[#343434]",
              "origin-top scale-y-0 overflow-hidden"
            )}
          />

          {/* right */}
          <div
            ref={lineRightRef}
            className={cn(
              "absolute inset-y-0 right-5 w-px",
              "border-r border-[#343434]",
              "origin-bottom scale-y-0 overflow-hidden"
            )}
          />
        </div>

        {/* content */}
        <div
          className={cn(
            "relative min-h-[100dvh]",
            "px-[max(3.5vw,100px)]",
            "flex flex-col items-center justify-center"
          )}
        >
          {/* description */}
          <h4
            ref={descriptionRef}
            className={cn(
              "mb-[1.8rem] max-w-[40ch]",
              "text-center text-[1.25rem] font-medium leading-[1] text-[#acacac]",
              "overflow-hidden"
            )}
          >
            I am a Creative Web Developer based in Auckland, New Zealand.
            <br />I believe in crafting web experiences to visually and emotionally captivate and inspire users.
          </h4>
        </div>
      </div>
    </div>
  )
}
