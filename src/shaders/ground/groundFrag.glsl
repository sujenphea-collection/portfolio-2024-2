uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;

uniform vec3 u_color;
uniform sampler2D u_texture;
uniform sampler2D u_shadowTexture;
uniform sampler2D u_maskTexture;
uniform sampler2D u_mroTexture;

uniform float u_scale; // scales uv for baked texture
uniform float u_stageLightRatio;
uniform vec3 u_stageLightColor;

varying vec4 v_uv;
varying vec2 v_uv2;
varying vec3 v_pos;
varying vec3 v_normal;

#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>
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

  float noiseUvRepeat = 8.0;
  float noise = texture2D(u_maskTexture, v_uv2 * noiseUvRepeat).g;

  // add light
  vec3 light = vec3(0.0);

  vec3 viewDirection = normalize(v_pos - cameraPosition);
  vec3 lightPos = vec3(0.0, 2.0, 1.0);
  vec3 lightColor = vec3(0.8, 0.8, 1.0);
  float lightIntensity = 0.8;
  light += lightPoint(v_pos, v_normal, viewDirection, lightPos, lightColor, lightIntensity, 3.0, 1.0, 1.0);

  color += light * (clamp(u_stageLightRatio, 0.4, 1.0));

  // get reflection
  vec4 uvOffset = v_uv;
  uvOffset.x = uvOffset.x + uvOffset.x * (noise * 6.0 - 3.0) * 0.005;

  vec4 reflection = texture2DProj(u_texture, uvOffset);

  // add reflection + noise
  color += mix(vec3(noise) * 0.5, reflection.rgb, 0.4);

  // get stage light alpha
  vec2 stageLightUV = (v_uv2 - 0.5) * u_scale + 0.5;
  vec3 stageLight = texture2D(u_shadowTexture, stageLightUV).rgb;
  float stageLightAlpha = smoothstep(0.1, 1.0, stageLight.b);
  
  // - animate left y 
  float mappedY = crange(1.0 - v_uv2.y, 0.4, 0.54, 0.0, 1.0);
  float yLeftRatio = step(mappedY, u_stageLightRatio * 2.0) * step(v_uv2.x, 0.5); // left half

  // - animate right y
  mappedY = crange(v_uv2.y, 0.46, 0.6, 0.0, 1.0);
  float yAlpha = clamp(u_stageLightRatio * 2.0 - 1.0, 0.0, 1.0);
  float yRightRatio = step(mappedY, yAlpha) * (1.0 - step(v_uv2.x, 0.5)); // right half

  // - animate x
  float mappedX = crange(v_uv2.x, 0.44, 0.56, 0.0, 1.0);
  float xRatio = step(mappedX, u_stageLightRatio);

  // - add stage light
  float stageLightRatio = stageLightAlpha * xRatio * yLeftRatio + stageLightAlpha * xRatio * yRightRatio;
  color += u_stageLightColor * stageLightRatio;

  // fog
  float fogDepth = v_pos.z - 3.0;
  float fogDensity = 0.08;
  float fogFactor = exp(-fogDensity * fogDensity * fogDepth * fogDepth);
  alpha = (1.0 - pow(fogFactor, 4.0)) * fogFactor;

  // apply color
  gl_FragColor = vec4(color, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}