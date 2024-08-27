import { createPortal } from "@react-three/fiber"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { PerspectiveCamera, Scene } from "three"
import { SceneHandle } from "../types/SceneHandle"

export const AboutScene = forwardRef<SceneHandle>((_, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(new PerspectiveCamera(45, 1, 0.1, 200))

  /* -------------------------------- functions ------------------------------- */
  const resize = () => {
    camera.current.position.set(0, 0, 5)
    camera.current.aspect = window.innerWidth / window.innerHeight
    camera.current.updateProjectionMatrix()
  }

  /* --------------------------------- handle --------------------------------- */
  useImperativeHandle(ref, () => ({
    scene: () => scene.current,
    camera: () => camera.current,
  }))

  /* --------------------------------- effects -------------------------------- */
  // resize
  useEffect(() => {
    resize()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- main ---------------------------------- */
  return createPortal(
    <group>
      <mesh>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color={0x363636} />
      </mesh>
    </group>,
    scene.current
  )
})
AboutScene.displayName = "AboutScene"
