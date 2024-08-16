attribute vec3 instancePosition;
attribute vec4 instanceRands;

uniform float u_time;

varying float v_opacity;
varying float v_density;
varying vec2 v_uv;

#define PI 3.1415926538

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(instancePosition, 1.0);

  // get local position
  float scale = mix(4., 20., instanceRands.x);
  float size = 0.2 * scale;
  
  vec3 localPosition = vec3(position.xy, 0.) * size;
  mvPosition.xy += localPosition.xy;

  // apply position
  gl_Position = projectionMatrix * mvPosition;

  // set varyings
  v_uv = position.xy + 0.5;
  v_density = smoothstep(.15, 0., instanceRands.x);
  v_opacity = (instanceRands.y * 0.7 + 
               sin(u_time * mix(1., 5., instanceRands.z) + instanceRands.w * 6.283) * 0.3);
}