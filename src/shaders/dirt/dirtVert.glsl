// instance
attribute vec3 instancePos;
attribute vec4 instanceRands;

uniform float u_time;
uniform sampler2D u_offsetTexture;

// varyings
varying float v_opacity;
varying float v_density;
varying vec2 v_uv;
varying float v_offset;

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 pos = position;

  // scale
  float scale = mix(0.01, 0.1, instanceRands.x);
  float size = 0.2 * scale;
  pos *= size;

  // position
  pos += instancePos;

  // offset
  vec2 uv = (vec2(instancePos.x, -instancePos.z) * 2.0 + 1.0) * 0.5;
  float offset = length(texture2D(u_offsetTexture, uv).xy);
  pos.y += (offset * instanceRands.x * instanceRands.y);

  // display
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // set varyings
  v_uv = position.xz + 0.5;
  v_offset = offset * instanceRands.z;
  v_density = smoothstep(.15, 0., instanceRands.x);
  v_opacity = (instanceRands.y * 0.7 + 
               sin(u_time * mix(1., 5., instanceRands.z) + instanceRands.w * 6.283) * 0.3);
}