// =====================================================
// TACZ VECTOR UTILITIES
// =====================================================

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function multiply(vector, scalar) {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  };
}

export function length(vector) {
  return Math.sqrt(
    vector.x * vector.x +
    vector.y * vector.y +
    vector.z * vector.z
  );
}

export function normalize(vector) {
  const magnitude = length(vector);

  if (magnitude <= 0.000001) {
    return { x: 0, y: 0, z: 1 };
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
}

export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function distance(a, b) {
  return length(subtract(a, b));
}

export function pointAlongRay(origin, direction, distanceAlongRay) {
  return add(origin, multiply(direction, distanceAlongRay));
}
