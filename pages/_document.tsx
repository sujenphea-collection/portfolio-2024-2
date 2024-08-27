import { Head, Html, Main, NextScript } from "next/document"
import { cn } from "../src/utils/utils"
import { nunitoFont } from "./_app"

export default function Document() {
  return (
    <Html lang="en" className={cn(nunitoFont.variable)}>
      <Head />
      <body className="bg-bgColor text-contentColor">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
