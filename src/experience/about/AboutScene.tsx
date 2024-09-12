import { createPortal, useFrame } from "@react-three/fiber"
import { useAtom } from "jotai"
import { forwardRef, MutableRefObject, useEffect, useImperativeHandle, useRef } from "react"
import { PerspectiveCamera, Scene } from "three"
import { postAnimateInSceneAtom } from "../../atoms/sceneAtoms"
import { SceneHandle } from "../types/SceneHandle"

export const AboutScene = forwardRef<SceneHandle, { introIn: MutableRefObject<boolean> }>((props, ref) => {
  /* ---------------------------------- refs ---------------------------------- */
  const scene = useRef(new Scene())
  const camera = useRef(new PerspectiveCamera(45, 1, 0.1, 200))

  const needsIntro = useRef(true)

  /* ---------------------------------- atoms --------------------------------- */
  const [, setPostAnimateInScene] = useAtom(postAnimateInSceneAtom)

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

  /* ---------------------------------- tick ---------------------------------- */
  useFrame(() => {
    if (needsIntro.current && props.introIn.current) {
      setPostAnimateInScene(true)
      needsIntro.current = false
    }
  })

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
        <meshBasicMaterial color={0x363636} toneMapped={false} />
      </mesh>
    </group>,
    scene.current
  )
})
AboutScene.displayName = "AboutScene"
