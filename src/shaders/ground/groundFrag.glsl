uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;

uniform vec3 u_color;
uniform sampler2D u_texture;
uniform sampler2D u_shadowTexture;
uniform sampler2D u_maskTexture;
uniform sampler2D u_mroTexture;

uniform float u_scale; // scales uv for baked texture

uniform float u_shadowShowRatio;

varying vec4 v_uv;
varying vec2 v_uv2;
varying vec3 v_pos;
varying vec3 v_normal;

#include <logdepthbuf_pars_fragment>
#include <lights>

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float range(float oldValue, float oldMin, float oldMax, float newMin, float newMax) {
  float oldRange = oldMax - oldMin;
  float newRange = newMax - newMin;
  return (((oldValue - oldMin) * newRange) / oldRange) + newMin;
}

float crange(float oldValue, float oldMin, float oldMax, float newMin, float newMax) {
  return clamp(range(oldValue, oldMin, oldMax, newMin, newMax), min(newMax, newMin), max(newMin, newMax));
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
	#include <logdepthbuf_fragment>

  // variables
  vec2 uRough = vec2(0, 0.9700000000000002);
  float uReflect = 0.6;

  vec3 color = vec3(0.0);
  float alpha = 1.0;

  float noise = texture2D(u_maskTexture, v_uv2).g;
  
  // add light
  vec3 light = vec3(0.0);

  vec3 viewDirection = normalize(v_pos - cameraPosition);
  vec3 lightPos = vec3(0.0, 4.0, 0.0);
  vec3 lightColor = vec3(0.8, 0.8, 1.0);
  float lightIntensity = 0.4;
  light += lightPoint(v_pos, v_normal, viewDirection, lightPos, lightColor, lightIntensity, 20.0, 0.0, 0.0);

  color += light;

  // get reflection
  vec4 uvOffset = vec4(noise * 0.1, 0.0, 0.0, noise * 0.0);
  vec4 reflection = texture2DProj(u_texture, v_uv + uvOffset);
  color += reflection.rgb * uReflect;

  // add noise
  color *= crange(1.0 - noise, 0.0, 1.0, 0.0, 0.8);
  
  
  // get shadow alpha
  vec2 shadowUv = (v_uv2 - 0.5) * u_scale + 0.5;
  vec3 shadows = texture2D(u_shadowTexture, shadowUv).rgb;
  float shadowAlpha = smoothstep(0.1, 1.0, shadows.b) * u_shadowShowRatio;
  color += vec3(shadowAlpha);

  // apply color
  gl_FragColor = vec4(color, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}