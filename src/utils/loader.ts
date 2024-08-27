import {
  ClampToEdgeWrapping,
  LinearFilter,
  SRGBColorSpace,
  Texture as _Texture,
  TextureLoader,
  VideoTexture,
  WebGLRenderer,
} from "three"
import { DRACOLoader, GLTFLoader, KTX2Loader, OBJLoader } from "three-stdlib"

export enum ItemType {
  Texture,
  KTX2Texture,
  "VideoTexture",
  Obj,
  Glb,
  Gltf,
  Image,
  Video,
}

type Item = {
  url: string

  loaded: boolean

  type: ItemType

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoad?: (e: any) => void
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
export class Loader {
  itemList: Item[] = []

  queue: Item[] = []

  // loaders
  static textureLoader = new TextureLoader()

  ktx2Loader = new KTX2Loader()

  gltfLoader = new GLTFLoader()

  objLoader = new OBJLoader()

  mediaContainer: HTMLDivElement

  // props
  gl?: WebGLRenderer

  onProgress?: (percent: number) => void

  /* --------------------------------- getters -------------------------------- */
  get loadedItems() {
    return this.itemList.filter((v) => v.loaded).length
  }

  get totalItems() {
    return this.itemList.length
  }

  /* --------------------------------- loaders -------------------------------- */
  loadTexture(item: Item) {
    const texture = Loader.textureLoader.load(item.url, (tex) => {
      // eslint-disable-next-line no-param-reassign
      item.content = tex

      this.onItemLoad(item)
    })

    // texture.minFilter = LinearFilter
    // texture.magFilter = LinearFilter
    // texture.wrapS = ClampToEdgeWrapping
    // texture.wrapT = ClampToEdgeWrapping
    texture.flipY = false
    texture.needsUpdate = true

    return texture
  }

  loadKTX2Texture(item: Item) {
    if (!this.gl) {
      console.error("dbg - no gl defined")
      this.onItemLoad(item)
      return
    }

    this.ktx2Loader.load(item.url, (_texture) => {
      const texture = _texture
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture.wrapS = ClampToEdgeWrapping
      texture.wrapT = ClampToEdgeWrapping
      texture.flipY = true
      texture.needsUpdate = true
      texture.colorSpace = SRGBColorSpace

      this.gl?.initTexture(texture)

      // eslint-disable-next-line no-param-reassign
      item.content = texture
      this.onItemLoad(item)
    })
  }

  loadVideoTexture(item: Item) {
    const video = document.createElement("video")
    video.crossOrigin = ""
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.autoplay = true

    let width = 0
    let height = 0

    const load = () => {
      const texture = new VideoTexture(video)
      this.gl?.initTexture(texture)

      video.pause()
      video.load()

      texture.userData.video = video
      texture.userData.width = video.videoWidth > 0 ? video.videoWidth : width
      texture.userData.height = video.videoHeight > 0 ? video.videoHeight : height

      // eslint-disable-next-line no-param-reassign
      item.content = texture
      this.onItemLoad(item)
    }

    video.addEventListener("loadeddata", () => video.addEventListener("timeupdate", load, { once: true }), {
      once: true,
    })

    video.onplaying = () => {
      width = video.videoWidth
      height = video.videoHeight
    }

    video.addEventListener("error", load, { once: true })

    video.src = item.url
    video.dataset.src = item.url
    video.load()
    video.play().catch((o) => {
      // eslint-disable-next-line no-console
      console.error(o)

      load()
    })
  }

  // gltf + glb
  loadGlbModel(item: Item) {
    this.gltfLoader.load(item.url, (gltf) => {
      // eslint-disable-next-line no-param-reassign
      item.content = gltf

      this.onItemLoad(item)
    })
  }

  // obj
  loadObjModel(item: Item) {
    this.objLoader.load(item.url, (obj) => {
      // eslint-disable-next-line no-param-reassign
      item.content = obj

      this.onItemLoad(item)
    })
  }

  loadImage(item: Item) {
    const img = new Image(0, 0)

    img.onload = () => {
      // eslint-disable-next-line no-param-reassign
      item.content = img
      this.onItemLoad(item)
    }

    img.onerror = () => {
      // eslint-disable-next-line no-param-reassign
      item.content = img
      this.onItemLoad(item)
    }

    img.src = item.url
    img.alt = ""

    this.mediaContainer.appendChild(img)
  }

  loadVideo(item: Item) {
    const videoEl = document.createElement("video") as HTMLVideoElement

    videoEl.addEventListener(
      "canplaythrough",
      () => {
        videoEl.addEventListener(
          "timeupdate",
          () => {
            videoEl.pause()
            videoEl.currentTime = 0.05
            // eslint-disable-next-line no-param-reassign
            item.content = videoEl
            this.onItemLoad(item)
          },
          { once: !0 }
        )
      },
      { once: !0 }
    )

    videoEl.addEventListener(
      "error",
      (s) => {
        console.error(new Error("Video not loaded", { cause: s }))
      },
      { once: !0 }
    )

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isSafari) {
      videoEl.addEventListener("suspend", () => {
        window.addEventListener(
          "click",
          () => {
            if (videoEl.currentTime < 0.01) {
              videoEl.currentTime = 0.05
            }
          },
          { once: !0 }
        )

        // eslint-disable-next-line no-param-reassign
        item.content = videoEl
        this.onItemLoad(item)
      })
    }

    if (videoEl.src === "" && videoEl.dataset.src) {
      videoEl.src = videoEl.dataset.src
    }

    videoEl.load()
    videoEl
      .play()
      .then(() => {
        // eslint-disable-next-line no-param-reassign
        item.content = videoEl
        this.onItemLoad(item)
      })
      .catch(() => {
        // eslint-disable-next-line no-param-reassign
        item.content = videoEl
        this.onItemLoad(item)
      })
  }

  /* --------------------------------- static --------------------------------- */
  static loadTexture(url: string, options?: { flipY?: boolean; onLoad?: (texture: _Texture) => void }) {
    const texture = this.textureLoader.load(url, (tex) => {
      options?.onLoad?.(tex)
    })

    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = ClampToEdgeWrapping
    texture.wrapT = ClampToEdgeWrapping
    texture.flipY = options?.flipY === undefined ? false : options.flipY
    texture.needsUpdate = true

    return texture
  }

  /* ---------------------------------- utils --------------------------------- */
  onCompleteLoad() {
    if (document.body.contains(this.mediaContainer)) {
      document.body.removeChild(this.mediaContainer)
    }
  }

  loadNext() {
    const item = this.queue.shift()

    if (!item) {
      return
    }
    this.loadNext()

    // load
    switch (item.type) {
      case ItemType.Texture:
        this.loadTexture(item)
        break
      case ItemType.KTX2Texture:
        this.loadKTX2Texture(item)
        break
      case ItemType.VideoTexture:
        this.loadVideoTexture(item)
        break
      case ItemType.Glb:
        this.loadGlbModel(item)
        break
      case ItemType.Gltf:
        this.loadGlbModel(item)
        break
      case ItemType.Obj:
        this.loadObjModel(item)
        break
      case ItemType.Image:
        this.loadImage(item)
        break
      case ItemType.Video:
        this.loadVideo(item)
        break
      default:
        break
    }
  }

  onItemLoad(item: Item) {
    // eslint-disable-next-line no-param-reassign
    item.loaded = true
    item.onLoad?.(item.content)
    this.loadNext()

    const progress = this.loadedItems / this.totalItems
    this.onProgress?.(progress * 100)

    // check for completion
    if (progress >= 1) {
      this.onCompleteLoad()
    }
  }

  /* --------------------------------- public --------------------------------- */
  constructor(gl?: WebGLRenderer, onProgress?: (percent: number) => void) {
    this.onProgress = onProgress
    this.gl = gl

    // setup ktx2 loader
    if (this.gl) {
      this.ktx2Loader.detectSupport(this.gl)
    }
    this.ktx2Loader.setTranscoderPath("/basis/")

    // setup gltf
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/draco/")
    this.gltfLoader.setDRACOLoader(dracoLoader)

    // setup media container
    const mediaContainerEl = document.createElement("div")
    this.mediaContainer = mediaContainerEl
    mediaContainerEl.style.height = "0px"
    mediaContainerEl.style.overflow = "hidden"
    mediaContainerEl.style.position = "fixed"
    mediaContainerEl.style.zIndex = "-1000"
    document.body.appendChild(mediaContainerEl)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(url: string, type: ItemType, config?: { onLoad?: (e: any) => void }) {
    this.itemList.push({ url, loaded: false, type, content: null, onLoad: config?.onLoad })
  }

  start() {
    if (this.itemList.length <= 0) {
      this.onProgress?.(100)
    }

    this.itemList.forEach((item) => {
      if (item.loaded) {
        return
      }

      this.queue.push(item)
    })

    this.loadNext()
  }
}
