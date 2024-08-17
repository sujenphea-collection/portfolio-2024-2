/* eslint-disable no-bitwise */

const _sfc32 = (a: number, b: number, c: number, d: number) => {
  return () => {
    // eslint-disable-next-line no-param-reassign
    a |= 0
    // eslint-disable-next-line no-param-reassign
    b |= 0
    // eslint-disable-next-line no-param-reassign
    c |= 0
    // eslint-disable-next-line no-param-reassign
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    // eslint-disable-next-line no-param-reassign
    d = (d + 1) | 0
    // eslint-disable-next-line no-param-reassign
    a = b ^ (b >>> 9)
    // eslint-disable-next-line no-param-reassign
    b = (c + (c << 3)) | 0
    // eslint-disable-next-line no-param-reassign
    c = (c << 21) | (c >>> 11)
    // eslint-disable-next-line no-param-reassign
    c = (c + t) | 0

    return (t >>> 0) / 4294967296
  }
}

export class MathUtils {
  static PI = Math.PI

  static PI2 = this.PI * 2

  static HALF_PI = this.PI * 0.5

  static DEG2RAD = this.PI / 180

  static RAD2DEG = 180 / this.PI

  /**
   * Calculates the interpolation factor given the boundaries and the current value.
   */
  static linearStep(from: number, to: number, v: number) {
    const r = (v - from) / (to - from)

    return this.clamp(r, 0, 1)
  }

  static step(v: number, max: number) {
    return v > max ? 0 : 1
  }

  static clamp(v: number, min: number, max: number) {
    if (v < min) {
      return min
    }

    if (v > max) {
      return max
    }

    return v
  }

  static mod(e: number, t: number) {
    return e - t * Math.floor(e / t)
  }

  static mix(min: number, max: number, v: number) {
    return min * (1 - v) + max * v
  }

  /**
   * linear interpolation with clamped interpolation factor
   */
  static cMix(v1: number, v2: number, r: number) {
    return v1 + (v2 - v1) * this.clamp(r, 0, 1)
  }

  /**
   * Reverse lerp to calculate the interpolation factor
   */
  static unMix(from: number, to: number, v: number) {
    return (v - from) / (to - from)
  }

  /**
   * Reverse lerp to calculate the interpolation factor, bounded between 0 and 1
   */
  static cUnMix(from: number, to: number, v: number) {
    return this.clamp((v - from) / (to - from), 0, 1)
  }

  /**
   * Bound the number between 0 and 1
   */
  static saturate(e: number) {
    return this.clamp(e, 0, 1)
  }

  static fit(v: number, fromMin: number, fromMax: number, toMin: number, toMax: number, mapFn?: (x: number) => number) {
    let normalisedValue = this.cUnMix(fromMin, fromMax, v)

    // Optionally apply a custom mapping function
    if (mapFn) {
      normalisedValue = mapFn(normalisedValue)
    }

    // Map the normalized value to the desired output range
    return toMin + normalisedValue * (toMax - toMin)
  }

  static unClampedFit(
    v: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number,
    mapFn?: (x: number) => number
  ) {
    let normalisedValue = this.unMix(fromMin, fromMax, v)

    // Optionally apply a custom mapping function
    if (mapFn) {
      normalisedValue = mapFn(normalisedValue)
    }

    // Map the normalized value to the desired output range
    return toMin + normalisedValue * (toMax - toMin)
  }

  /**
   * Looping effect to ensure v stays within the (min, max) range
   */
  static loop(v: number, min: number, max: number) {
    const _e = v - min
    const _r = max - min

    // value below the min range
    // calculation: minus value from the max value
    if (_e < 0) {
      return ((_r - (Math.abs(_e) % _r)) % _r) + min
    }

    return (_e % _r) + min
  }

  static smoothstep(v: number, min: number, max: number) {
    const _r = this.cUnMix(v, min, max)

    return _r * _r * (3 - _r * 2)
  }

  static fract(e: number) {
    return e - Math.floor(e)
  }

  static hash(e: number) {
    return this.fract(Math.sin(e) * 43758.5453123)
  }

  static hash2(e: number, t: number) {
    return this.fract(Math.sin(e * 12.9898 + t * 4.1414) * 43758.5453)
  }

  static sign(e: number) {
    // eslint-disable-next-line no-nested-ternary
    return e ? (e < 0 ? -1 : 1) : 0
  }

  static isPowerOfTwo(e: number) {
    // eslint-disable-next-line no-bitwise
    return (e & -e) === e
  }

  static powerTwoCeilingBase(e: number) {
    return Math.ceil(Math.log(e) / Math.log(2))
  }

  static powerTwoCeiling(e: number) {
    // eslint-disable-next-line no-bitwise
    return this.isPowerOfTwo(e) ? e : 1 << this.powerTwoCeilingBase(e)
  }

  static powerTwoFloorBase(e: number) {
    return Math.floor(Math.log(e) / Math.log(2))
  }

  static powerTwoFloor(e: number) {
    // eslint-disable-next-line no-bitwise
    return this.isPowerOfTwo(e) ? e : 1 << this.powerTwoFloorBase(e)
  }

  static latLngBearing(e: number, t: number, r: number, n: number) {
    const o = Math.sin(n - t) * Math.cos(r)
    const l = Math.cos(e) * Math.sin(r) - Math.sin(e) * Math.cos(r) * Math.cos(n - t)
    return Math.atan2(o, l)
  }

  static distanceTo(e: number, t: number) {
    return Math.sqrt(e * e + t * t)
  }

  static distanceSqrTo(e: number, t: number) {
    return e * e + t * t
  }

  static distanceTo3(e: number, t: number, r: number) {
    return Math.sqrt(e * e + t * t + r * r)
  }

  static distanceSqrTo3(e: number, t: number, r: number) {
    return e * e + t * t + r * r
  }

  static latLngDistance(e: number, t: number, r: number, n: number) {
    const o = Math.sin((r - e) / 2)
    const l = Math.sin((n - t) / 2)
    const c = o * o + Math.cos(e) * Math.cos(r) * l * l
    return 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
  }

  static cubicBezier(e: number, t: number, r: number, n: number, v: number) {
    const l = (t - e) * 3
    const c = (r - t) * 3 - l
    const u = n - e - l - c
    const f = v * v
    const p = f * v
    return u * p + c * f + l * v + e
  }

  static cubicBezierFn(e: number, t: number, r: number, n: number) {
    const o = (t - e) * 3
    const l = (r - t) * 3 - o
    const c = n - e - o - l

    return (u: number) => {
      const f = u * u
      const p = f * u
      return c * p + l * f + o * u + e
    }
  }

  static normalizeAngle(e: number) {
    let _e = e + this.PI
    _e = _e < 0 ? this.PI2 - Math.abs(_e % this.PI2) : _e % this.PI2
    _e -= this.PI

    return _e
  }

  static closestAngleTo(e: number, t: number) {
    return e + this.normalizeAngle(t - e)
  }

  static randomRange(e: number, t: number) {
    return e + Math.random() * (t - e)
  }

  static randomRangeInt(e: number, t: number) {
    return Math.floor(this.randomRange(e, t + 1))
  }

  static padZero(e: number, t: number) {
    return e.toString().length >= t ? e : (10 ** t + Math.floor(e)).toString().substring(1)
  }

  static degToRad(a: number) {
    return a * this.DEG2RAD
  }

  static radToDeg(a: number) {
    return a * this.RAD2DEG
  }

  static getSeedRandomFn = (o: string) => {
    let a = 1779033703
    let l = 3144134277
    let u = 1013904242
    let p = 2773480762
    for (let v = 0, g; v < o.length; v += 1) {
      g = o.charCodeAt(v)
      a = l ^ Math.imul(a ^ g, 597399067)
      l = u ^ Math.imul(l ^ g, 2869860233)
      u = p ^ Math.imul(u ^ g, 951274213)
      p = a ^ Math.imul(p ^ g, 2716044179)
    }

    return _sfc32(
      Math.imul(u ^ (a >>> 18), 597399067),
      Math.imul(p ^ (l >>> 22), 2869860233),
      Math.imul(a ^ (u >>> 17), 951274213),
      Math.imul(l ^ (p >>> 19), 2716044179)
    )
  }
}
