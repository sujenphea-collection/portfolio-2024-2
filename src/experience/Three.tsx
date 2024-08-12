"use client"

import { ReactNode } from "react"
import tunnel from "tunnel-rat"

export const r3f = tunnel()
export const Three = (props: { children?: ReactNode }) => {
  return <r3f.In>{props.children}</r3f.In>
}
