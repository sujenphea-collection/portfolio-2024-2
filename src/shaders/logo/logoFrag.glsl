uniform float u_progress;

varying vec3 v_pos;
varying vec3 v_normal;

#include <lights>

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(0.5);
  float alpha = 0.0;

  // get alpha
  float alphaRatio = min(u_progress * 10.0, 1.0);
  alpha = mix(0.0, 1.0, alphaRatio);

  // get color
  float colorRatio = min(u_progress * 10.0, 1.0);
  color = mix(vec3(0.0), vec3(0.5), colorRatio);

  // add light
  vec3 light = vec3(0.0);

  vec3 viewDirection = normalize(v_pos - cameraPosition);
  vec3 lightPos = vec3(0.0, 4.0, -2.5);
  vec3 lightColor = vec3(0.8, 0.8, 1.0);
  float lightIntensity = 10.0;
  light += lightPoint(v_pos, v_normal, viewDirection, lightPos, lightColor, lightIntensity, 20.0, 0.0, 0.0);
  
  float lightRatio = min(max(0.0, (u_progress - 0.8) * 10.0), 1.0);
  color += mix(vec3(0.0), light, lightRatio);

  // set color
  gl_FragColor = vec4(color, alpha);
}