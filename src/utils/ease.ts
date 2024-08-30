// from https://github.com/kaelzhang/easing-functions/

/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-cond-assign */
/* eslint-disable no-return-assign */
export default class Ease {
  static quadIn(e: number) {
    return e * e
  }

  static quadOut(e: number) {
    return e * (2 - e)
  }

  static quadInOut(e: number) {
    return (e *= 2) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1)
  }

  static cubicIn(e: number) {
    return e * e * e
  }

  static cubicOut(e: number) {
    return --e * e * e + 1
  }

  static cubicInOut(e: number) {
    return (e *= 2) < 1 ? 0.5 * e * e * e : 0.5 * ((e -= 2) * e * e + 2)
  }

  static quartIn(e: number) {
    return e * e * e * e
  }

  static quartOut(e: number) {
    return 1 - --e * e * e * e
  }

  static quartInOut(e: number) {
    return (e *= 2) < 1 ? 0.5 * e * e * e * e : -0.5 * ((e -= 2) * e * e * e - 2)
  }

  static quintIn(e: number) {
    return e * e * e * e * e
  }

  static quintOut(e: number) {
    return --e * e * e * e * e + 1
  }

  static quintInOut(e: number) {
    return (e *= 2) < 1 ? 0.5 * e * e * e * e * e : 0.5 * ((e -= 2) * e * e * e * e + 2)
  }

  static sineIn(e: number) {
    return 1 - Math.cos((e * Math.PI) / 2)
  }

  static sineOut(e: number) {
    return Math.sin((e * Math.PI) / 2)
  }

  static sineInOut(e: number) {
    return 0.5 * (1 - Math.cos(Math.PI * e))
  }

  static expoIn(e: number) {
    return e === 0 ? 0 : 1024 ** (e - 1)
  }

  static expoOut(e: number) {
    return e === 1 ? 1 : 1 - 2 ** (-10 * e)
  }

  static expoInOut(e: number) {
    return e === 0 ? 0 : e === 1 ? 1 : (e *= 2) < 1 ? 0.5 * 1024 ** (e - 1) : 0.5 * (-(2 ** (-10 * (e - 1))) + 2)
  }

  static circIn(e: number) {
    return 1 - Math.sqrt(1 - e * e)
  }

  static circOut(e: number) {
    return Math.sqrt(1 - --e * e)
  }

  static circInOut(e: number) {
    return (e *= 2) < 1 ? -0.5 * (Math.sqrt(1 - e * e) - 1) : 0.5 * (Math.sqrt(1 - (e -= 2) * e) + 1)
  }

  static elasticIn(e: number) {
    let t
    let i = 0.1
    const n = 0.4
    return e === 0
      ? 0
      : e === 1
        ? 1
        : (!i || i < 1 ? ((i = 1), (t = n / 4)) : (t = (n * Math.asin(1 / i)) / (2 * Math.PI)),
          -(i * 2 ** (10 * (e -= 1)) * Math.sin(((e - t) * 2 * Math.PI) / n)))
  }

  static elasticOut(e: number) {
    let t
    let i = 0.1
    const n = 0.4
    return e === 0
      ? 0
      : e === 1
        ? 1
        : (!i || i < 1 ? ((i = 1), (t = n / 4)) : (t = (n * Math.asin(1 / i)) / (2 * Math.PI)),
          i * 2 ** (-10 * e) * Math.sin(((e - t) * 2 * Math.PI) / n) + 1)
  }

  static elasticInOut(e: number) {
    let t
    let i = 0.1
    const n = 0.4
    return e === 0
      ? 0
      : e === 1
        ? 1
        : (!i || i < 1 ? ((i = 1), (t = n / 4)) : (t = (n * Math.asin(1 / i)) / (2 * Math.PI)),
          (e *= 2) < 1
            ? -0.5 * i * 2 ** (10 * (e -= 1)) * Math.sin(((e - t) * 2 * Math.PI) / n)
            : i * 2 ** (-10 * (e -= 1)) * Math.sin(((e - t) * 2 * Math.PI) / n) * 0.5 + 1)
  }

  static backIn(e: number) {
    const t = 1.70158
    return e * e * ((t + 1) * e - t)
  }

  static backOut(e: number) {
    const t = 1.70158
    return --e * e * ((t + 1) * e + t) + 1
  }

  static backInOut(e: number) {
    const t = 2.5949095
    return (e *= 2) < 1 ? 0.5 * e * e * ((t + 1) * e - t) : 0.5 * ((e -= 2) * e * ((t + 1) * e + t) + 2)
  }

  static bounceIn(e: number) {
    return 1 - this.bounceOut(1 - e)
  }

  static bounceOut(e: number) {
    return e < 1 / 2.75
      ? 7.5625 * e * e
      : e < 2 / 2.75
        ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75
        : e < 2.5 / 2.75
          ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375
          : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375
  }

  static bounceInOut(e: number) {
    return e < 0.5 ? this.bounceIn(e * 2) * 0.5 : this.bounceOut(e * 2 - 1) * 0.5 + 0.5
  }

  static cubicBezier(
    progress: number,
    startControlX: number,
    startControlY: number,
    endControlX: number,
    endControlY: number
  ) {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    if (startControlX === startControlY && endControlX === endControlY) return progress

    const derivative = (param: number, coeff1: number, coeff2: number, coeff3: number) =>
      1 / (3 * coeff1 * param * param + 2 * coeff2 * param + coeff3)
    const bezierValue = (param: number, coeff1: number, coeff2: number, coeff3: number, coeff4: number) =>
      coeff1 * (param * param * param) + coeff2 * (param * param) + coeff3 * param + coeff4
    const cubicBezierCalc = (param: number, coeff1: number, coeff2: number, coeff3: number, coeff4: number) => {
      const paramSquared = param * param
      return coeff1 * (paramSquared * param) + coeff2 * paramSquared + coeff3 * param + coeff4
    }

    const startX = 0
    const startY = 0
    const control1X = startControlX
    const control1Y = startControlY
    const control2X = endControlX
    const control2Y = endControlY
    const endX = 1
    const endY = 1
    const coeffAX = endX - 3 * control2X + 3 * control1X - startX
    const coeffBX = 3 * control2X - 6 * control1X + 3 * startX
    const coeffCX = 3 * control1X - 3 * startX
    const coeffDX = startX
    const coeffAY = endY - 3 * control2Y + 3 * control1Y - startY
    const coeffBY = 3 * control2Y - 6 * control1Y + 3 * startY
    const coeffCY = 3 * control1Y - 3 * startY
    const coeffDY = startY
    let currentProgress = progress
    let bezierResult
    let newDerivative
    // let newProgress

    for (let iteration = 0; iteration < 100; iteration++) {
      bezierResult = bezierValue(currentProgress, coeffAX, coeffBX, coeffCX, coeffDX)
      newDerivative = derivative(currentProgress, coeffAX, coeffBX, coeffCX)
      if (newDerivative === Infinity) newDerivative = progress
      currentProgress -= (bezierResult - progress) * newDerivative
      currentProgress = Math.min(Math.max(currentProgress, 0), 1)
    }

    return cubicBezierCalc(currentProgress, coeffAY, coeffBY, coeffCY, coeffDY)
  }
}
