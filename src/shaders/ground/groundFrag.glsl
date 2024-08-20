uniform vec3 u_color;
uniform sampler2D u_texture;
uniform sampler2D u_shadowTexture;
uniform sampler2D u_maskTexture;
uniform float u_scale; // scales uv for baked texture

uniform float u_shadowShowRatio;

varying vec4 v_uv;
varying vec2 v_uv2;

#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float blendOverlay(float base, float blend) {
  return (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
	#include <logdepthbuf_fragment>

  vec3 color = vec3(0.0);
  float alpha = 1.0;

  vec2 maskUv = (v_uv2 - 0.5) * u_scale + 0.5;
  float mask = texture2D(u_maskTexture, maskUv).r; 

  // get reflection
  vec4 uvOffset = vec4(mask * 0.0, 0.0, 0.0, mask * 0.2);
  vec4 base = texture2DProj(u_texture, v_uv + uvOffset);
  color += base.rgb;

  // color overlay
  color = blendOverlay(color, u_color);

  // dirt
  color *= mask;

  // get shadow alpha
  vec2 shadowUv = (v_uv2 - 0.5) * u_scale + 0.5;
  vec3 shadows = texture2D(u_shadowTexture, shadowUv).rgb;
  float shadowAlpha = smoothstep(0.1, 1.0, shadows.b) * u_shadowShowRatio;
  color += vec3(shadowAlpha);

  // apply color
  gl_FragColor = vec4(color, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}