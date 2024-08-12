import { Html, Head, Main, NextScript } from "next/document"
// import { fkGroteskkMonoFont, drukWideFont } from "./_app"

export default function Document() {
  return (
    <Html lang="en">
      {/* <Html lang="en" className={`${fkGroteskkMonoFont.variable} ${drukWideFont.variable}`}> */}
      <Head />
      <body className="bg-bgColor text-contentColor">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
