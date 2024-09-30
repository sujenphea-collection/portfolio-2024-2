import { SVGProps } from "react"

/* -------------------------------------------------------------------------- */
/*                                    svgs                                    */
/* -------------------------------------------------------------------------- */
const LeftArrow = (props: SVGProps<SVGSVGElement>) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke-width="2" d="M6,12.4 L18,12.4 M12.6,7 L18,12.4 L12.6,17.8" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                    types                                   */
/* -------------------------------------------------------------------------- */
export const icons = {
  LeftArrow,
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export const Icon = (props: SVGProps<SVGSVGElement> & { type: keyof typeof icons }) => {
  // eslint-disable-next-line react/destructuring-assignment
  const { type, ...rest } = props

  const IconComponent = icons[type]

  /* ---------------------------------- main ---------------------------------- */
  if (!IconComponent) {
    console.error(`Icon '${type}' not found`)
    return null
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconComponent {...rest} />
}
