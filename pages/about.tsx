import { cn } from "../src/utils/utils"

export default function About() {
  return (
    <div className="relative">
      {/* screen 1 */}
      <div className="relative">
        {/* decoration */}
        <div className={cn("absolute inset-0", "pointer-events-none, select-none")}>
          {/* top */}
          <div className={cn("absolute inset-x-0 top-5 h-px", "border-t border-[#343434]")} />

          {/* bottom */}
          <div className={cn("absolute inset-x-0 bottom-5 h-px", "border-t border-[#343434]")} />
        </div>

        {/* content */}
        <div
          className={cn("relative min-h-[100vh]", "px-[max(3.5vw,100px)]", "flex flex-col items-center justify-center")}
        >
          {/* description */}
          <h4
            className={cn(
              "mb-[1.8rem] max-w-[40ch]",
              "text-center text-[2.6rem] font-medium leading-[1.05] text-[#acacac] lg:text-[4rem]"
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
