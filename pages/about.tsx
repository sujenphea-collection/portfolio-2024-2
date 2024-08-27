import { cn } from "../src/utils/utils"

export default function About() {
  return (
    <div className="relative">
      <div className="">
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
