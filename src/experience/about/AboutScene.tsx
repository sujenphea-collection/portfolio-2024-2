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
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry />
        <meshBasicMaterial color={0x73eb93} />
      </mesh>

      <mesh position={[1.5, 0, 0]}>
        <torusKnotGeometry args={[0.5, 0.15, 64, 8, 2, 3]} />
        <meshNormalMaterial />
      </mesh>
    </group>,
    scene.current
  )
})
AboutScene.displayName = "AboutScene"
