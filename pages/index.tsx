import { basePadding, contactSectionId, homeSectionId, projectsSectionId } from "../src/constants/uiConstants"
import { cn } from "../src/utils/utils"

/* -------------------------------------------------------------------------- */
/*                                 components                                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export default function Home() {
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
