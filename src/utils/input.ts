import { MathUtils, Vector2 } from "three"
import { normalizeWheel } from "./normaliseWheel"
import { Properties } from "./properties"

export class Input {
  // hover
  static mouseXY = new Vector2()

  static mousePixelXY = new Vector2()

  static deltaPixelXY = new Vector2()

  static _prevMousePixelXY = new Vector2()

  static mouseScreenXY = new Vector2()

  // mouse down
  static downPixelXY = new Vector2()

  // scroll
  static deltaWheel = 0

  static isWheelScrolling = false

  // - scroll x
  static deltaScrollX = 0

  static lastScrollXDirection = 0

  // - scroll y
  static deltaScrollY = 0

  static lastScrollYDirection = 0

  // drag
  static isDown = false

  static downTime = 0

  /* --------------------------------- public --------------------------------- */
  static preInit() {
    document.addEventListener("mousedown", this._onDown.bind(this))
    document.addEventListener("touchstart", this._getTouchBound(this, this._onDown))
    document.addEventListener("mousemove", this._onMove.bind(this))
    document.addEventListener("touchmove", this._getTouchBound(this, this._onMove))
    document.addEventListener("mouseup", this._onUp.bind(this))
    document.addEventListener("touchend", this._getTouchBound(this, this._onUp))

    // wheel
    document.addEventListener("wheel", this._onWheel.bind(this))
    // document.addEventListener("mousewheel", this._onWheel.bind(this)) // wheel event supersedes support
  }

  static update() {}

  static postUpdate() {
    this.deltaWheel = 0
    this.deltaScrollX = 0
    this.deltaScrollY = 0
    this.deltaPixelXY.set(0, 0)
    this.isWheelScrolling = !1
  }

  /* ---------------------------------- utils --------------------------------- */
  static _getInputXY(ev: MouseEvent | Touch, outputVector: Vector2) {
    outputVector.set((ev.clientX / Properties.viewportWidth) * 2 - 1, 1 - (ev.clientY / Properties.viewportHeight) * 2)

    return outputVector
  }

  static _getInputPixelXY(ev: MouseEvent | Touch, outputVector: Vector2) {
    outputVector.set(ev.clientX, ev.clientY)
  }

  static _getInputScreenXY(ev: MouseEvent | Touch, outputVector: Vector2) {
    outputVector.set(ev.clientX / Properties.viewportWidth, 1 - ev.clientY / Properties.viewportHeight)
  }

  /* -------------------------------- listeners ------------------------------- */
  static _onDown(e: MouseEvent | Touch) {
    this.isDown = true

    this.downTime = +new Date()

    // reset hover
    this.deltaPixelXY.set(0, 0)

    this._getInputPixelXY(e, this.downPixelXY)
    this._prevMousePixelXY.copy(this.downPixelXY)

    this._getInputXY(e, this.mouseXY)

    this._onMove(e)
  }

  static _onMove(e: MouseEvent | Touch) {
    // get hover position
    this._getInputXY(e, this.mouseXY)
    this._getInputScreenXY(e, this.mouseScreenXY)
    this._getInputPixelXY(e, this.mousePixelXY)

    this.deltaPixelXY.copy(this.mousePixelXY).sub(this._prevMousePixelXY)
    this._prevMousePixelXY.copy(this.mousePixelXY)
  }

  static _onUp(e: MouseEvent | Touch) {
    const offsetX = e.clientX - this.downPixelXY.x
    const offsetY = e.clientY - this.downPixelXY.y

    if (Math.sqrt(offsetX * offsetX + offsetY * offsetY) < 40 && +new Date() - this.downTime < 300) {
      this._getInputXY(e, this.mouseXY)
    }

    this.isDown = false
  }

  static _getTouchBound(e: Input, t: (e: MouseEvent | Touch) => void, r?: boolean) {
    return (n: TouchEvent) => {
      if (r && n.preventDefault) {
        n.preventDefault()
      }

      t.call(e, n.changedTouches[0] || n.touches[0])
    }
  }

  static _onWheel(e: WheelEvent) {
    let scroll = normalizeWheel(e).pixelY
    scroll = MathUtils.clamp(scroll, -200, 200)

    this.deltaWheel += scroll
    this.isWheelScrolling = true

    this.deltaScrollX = this.deltaWheel
    this.deltaScrollY = this.deltaWheel

    this.lastScrollXDirection = this.deltaWheel > 0 ? 1 : -1
    this.lastScrollYDirection = this.deltaWheel > 0 ? 1 : -1
  }
}
