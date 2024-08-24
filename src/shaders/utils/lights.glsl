vec3 lightAmbient(vec3 lightColor, float intensity) {
  return lightColor * intensity;
}

vec3 lightDirectional(
  vec3 normal,
  vec3 viewDirection,

  vec3 lightPosition,
  vec3 lightColor,
  float intensity,

  float specularPower
) {
  vec3 lightDirection = normalize(lightPosition);
  vec3 n_normal = normalize(v_normal);

  // diffuse
  float diff = dot(n_normal, lightDirection);
  diff = max(0.0, diff);

  // specular
  vec3 reflectionDirection = reflect(-lightDirection, n_normal);
  float spec = -dot(reflectionDirection, viewDirection);
  spec = max(0.0, spec);
  spec = pow(spec, specularPower);

  return lightColor * intensity * (diff + spec);
}

vec3 lightPoint(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,

  vec3 lightPosition,
  vec3 lightColor,
  float intensity,

  float specularPower,
  float specularIntensity,
  float lightDecay
) {
  vec3 lightDelta = lightPosition - position;
  vec3 lightDirection = normalize(lightDelta);
  vec3 n_normal = normalize(v_normal);

  // diffuse
  float diff = dot(n_normal, lightDirection);
  diff = max(0.0, diff);

  // specular
  vec3 reflectionDirection = reflect(-lightDirection, n_normal);
  float spec = -dot(reflectionDirection, viewDirection);
  spec = max(0.0, spec);
  spec = pow(spec, specularPower);
  spec *= specularIntensity;

  // attenuation
  float lightDistance = length(lightDelta);

  float constant = 1.0;
  float linear = 0.09;
  float quadratic = 0.032;
  
  float attenuation = constant
                      + linear * lightDistance
                      + quadratic * (lightDistance * lightDistance);
  attenuation = max(0.0, attenuation);

  return (lightColor * intensity * (diff + spec)) / attenuation;
}
