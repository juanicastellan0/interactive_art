export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function averageBins(buffer, start, end) {
  let total = 0;
  const safeStart = clamp(Math.floor(start), 0, buffer.length - 1);
  const safeEnd = clamp(Math.floor(end), safeStart + 1, buffer.length);

  for (let index = safeStart; index < safeEnd; index += 1) {
    total += buffer[index];
  }

  return total / (safeEnd - safeStart);
}
