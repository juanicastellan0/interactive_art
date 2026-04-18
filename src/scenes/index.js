export const palettes = [
  {
    name: "Solar",
    bg1: "#120d08",
    bg2: "#251a12",
    panel: "rgba(18, 15, 13, 0.6)",
    accent: "#ff9652",
    fade: "rgba(18, 13, 8, 0.085)",
    wells: ["#ffc56b", "#ff6d47"],
    colors: [
      [255, 111, 76],
      [255, 168, 89],
      [255, 235, 185],
    ],
  },
  {
    name: "Reef",
    bg1: "#061319",
    bg2: "#123040",
    panel: "rgba(8, 18, 23, 0.58)",
    accent: "#66e3d3",
    fade: "rgba(6, 19, 25, 0.08)",
    wells: ["#8ef7f0", "#4fb0ff"],
    colors: [
      [90, 245, 222],
      [101, 170, 255],
      [233, 255, 248],
    ],
  },
  {
    name: "Nocturne",
    bg1: "#100814",
    bg2: "#1d1038",
    panel: "rgba(16, 8, 20, 0.56)",
    accent: "#f08bff",
    fade: "rgba(14, 8, 20, 0.075)",
    wells: ["#ffb5fb", "#9381ff"],
    colors: [
      [141, 129, 255],
      [240, 139, 255],
      [255, 242, 250],
    ],
  },
  {
    name: "Verdigris",
    bg1: "#08140c",
    bg2: "#1a2916",
    panel: "rgba(9, 18, 12, 0.58)",
    accent: "#a5f57b",
    fade: "rgba(8, 20, 12, 0.08)",
    wells: ["#f6fd92", "#5fd97a"],
    colors: [
      [95, 217, 122],
      [165, 245, 123],
      [244, 255, 221],
    ],
  },
  {
    name: "Cinder",
    bg1: "#130707",
    bg2: "#341313",
    panel: "rgba(22, 9, 9, 0.6)",
    accent: "#ff6a3d",
    fade: "rgba(16, 6, 6, 0.09)",
    wells: ["#ffb36e", "#ff4e3a"],
    colors: [
      [255, 78, 58],
      [255, 137, 92],
      [255, 235, 214],
    ],
  },
  {
    name: "Polar",
    bg1: "#07111a",
    bg2: "#11314c",
    panel: "rgba(8, 18, 28, 0.58)",
    accent: "#8be7ff",
    fade: "rgba(6, 15, 24, 0.08)",
    wells: ["#f7ffff", "#79ccff"],
    colors: [
      [103, 208, 255],
      [139, 231, 255],
      [247, 255, 255],
    ],
  },
  {
    name: "Acid",
    bg1: "#090f05",
    bg2: "#1f260c",
    panel: "rgba(13, 17, 7, 0.62)",
    accent: "#d4ff3f",
    fade: "rgba(8, 13, 4, 0.09)",
    wells: ["#f6ff95", "#7dff52"],
    colors: [
      [125, 255, 82],
      [212, 255, 63],
      [255, 255, 227],
    ],
  },
  {
    name: "Ultramarine",
    bg1: "#050816",
    bg2: "#1a2b63",
    panel: "rgba(8, 12, 24, 0.62)",
    accent: "#89a9ff",
    fade: "rgba(5, 8, 18, 0.085)",
    wells: ["#f3f7ff", "#5a7fff"],
    colors: [
      [90, 127, 255],
      [137, 169, 255],
      [245, 247, 255],
    ],
  },
  {
    name: "Ochre",
    bg1: "#171005",
    bg2: "#41280f",
    panel: "rgba(24, 15, 8, 0.62)",
    accent: "#ffbd55",
    fade: "rgba(17, 11, 5, 0.09)",
    wells: ["#ffe09f", "#ff8b35"],
    colors: [
      [255, 139, 53],
      [255, 189, 85],
      [255, 247, 221],
    ],
  },
  {
    name: "Rosefire",
    bg1: "#15070e",
    bg2: "#44152f",
    panel: "rgba(20, 8, 15, 0.62)",
    accent: "#ff74bf",
    fade: "rgba(15, 7, 12, 0.085)",
    wells: ["#ffc7e1", "#ff5d76"],
    colors: [
      [255, 93, 118],
      [255, 116, 191],
      [255, 241, 247],
    ],
  },
];

export function createVisualModes(tools) {
  const {
    state,
    ctx,
    clamp,
    pickColor,
    getAudioCenter,
    getReactorInfluence,
    getEventIntensity,
    drawReactors,
    drawBloomGlow,
  } = tools;

  function drawMirroredSegment(x1, y1, x2, y2, center, copies) {
    const rel1x = x1 - center.x;
    const rel1y = y1 - center.y;
    const rel2x = x2 - center.x;
    const rel2y = y2 - center.y;
    const step = (Math.PI * 2) / copies;

    for (let i = 0; i < copies; i += 1) {
      const angle = step * i;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const ax1 = center.x + rel1x * cos - rel1y * sin;
      const ay1 = center.y + rel1x * sin + rel1y * cos;
      const ax2 = center.x + rel2x * cos - rel2y * sin;
      const ay2 = center.y + rel2x * sin + rel2y * cos;

      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();

      const bx1 = center.x + rel1x * cos + rel1y * sin;
      const by1 = center.y + rel1x * sin - rel1y * cos;
      const bx2 = center.x + rel2x * cos + rel2y * sin;
      const by2 = center.y + rel2x * sin - rel2y * cos;

      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.lineTo(bx2, by2);
      ctx.stroke();
    }
  }

  function drawFlowParticle(particle, detail) {
    const { speed, t, centroid, energy, pulse, events } = detail;
    const bassBeat = events.bassBeat;
    const bassReturn = events.bassReturn;
    const highReturn = events.highReturn;
    const alpha = Math.min(
      0.4,
      0.03 + speed * 0.013 + energy * 0.11 + pulse * 0.08 + bassReturn * 0.1 + highReturn * 0.08,
    );
    const mix =
      (particle.tint +
        t * (0.015 + energy * 0.06) +
        centroid * 0.36 +
        speed * 0.03 +
        highReturn * 0.14) %
      1;
    const [r, g, b] = pickColor(mix);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = particle.width + Math.min(speed * 0.16 + pulse * 0.8 + bassBeat * 1.1 + bassReturn * 1.4, 3.4);
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();

    if (highReturn > 0.05) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + highReturn * 0.22})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 0.4 + highReturn * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawKaleidoParticle(particle, detail) {
    const { center, speed, energy, pulse, high, t, events } = detail;
    const highBeat = events.highBeat;
    const highReturn = events.highReturn;
    const bassReturn = events.bassReturn;
    const alpha = Math.min(0.26, 0.025 + speed * 0.009 + energy * 0.05 + pulse * 0.06 + highReturn * 0.12);
    const [r, g, b] = pickColor((particle.tint + t * 0.028 + high * 0.24 + speed * 0.02 + highReturn * 0.16) % 1);
    const copies = 5 + Math.round(high * 4 + pulse * 2 + highBeat * 2 + highReturn * 3);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 0.55 + particle.width * 0.55 + Math.min(speed * 0.05 + highBeat * 0.6 + bassReturn * 0.35, 1.3);
    drawMirroredSegment(particle.px, particle.py, particle.x, particle.y, center, copies);
  }

  function drawGridParticle(particle, detail) {
    const { speed, energy, pulse, t, centroid, events } = detail;
    const bassReturn = events.bassReturn;
    const highReturn = events.highReturn;
    const highBeat = events.highBeat;
    const [r, g, b] = pickColor((particle.tint + t * 0.014 + centroid * 0.25) % 1);
    const alpha = 0.06 + energy * 0.14 + pulse * 0.06 + highReturn * 0.12;
    const size = 1.2 + particle.width + pulse * 0.45 + bassReturn * 0.8;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(particle.x - size * 0.5, particle.y - size * 0.5, size, size);

    if (speed > 1.2) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
      ctx.lineWidth = 0.7 + energy * 0.8;
      ctx.beginPath();
      ctx.moveTo(particle.px, particle.py);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    }

    if (highBeat > 0.08 || highReturn > 0.08) {
      const cross = 1.6 + highBeat * 4 + highReturn * 6;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.07 + highReturn * 0.24})`;
      ctx.lineWidth = 0.55 + highReturn * 0.8;
      ctx.beginPath();
      ctx.moveTo(particle.x - cross, particle.y);
      ctx.lineTo(particle.x + cross, particle.y);
      ctx.moveTo(particle.x, particle.y - cross);
      ctx.lineTo(particle.x, particle.y + cross);
      ctx.stroke();
    }
  }

  function drawBloomParticle(particle, detail) {
    const { speed, bass, pulse, t, index, events } = detail;
    const bassReturn = events.bassReturn;
    const highReturn = events.highReturn;
    const highBeat = events.highBeat;
    const petalPulse = Math.max(bassReturn, highReturn * 0.85, highBeat * 0.7);
    const [r, g, b] = pickColor((particle.tint + t * 0.02 + bass * 0.24 + highReturn * 0.16) % 1);
    const radius = particle.width * (1.05 + particle.bloomLift * 0.55) + bass * 1.15 + petalPulse * 1.25;
    const alpha = Math.min(0.28, 0.05 + pulse * 0.09 + bassReturn * 0.12 + highReturn * 0.08);

    drawBloomGlow(particle.x, particle.y, radius * (1.25 + particle.bloomLift * 0.4), alpha);

    if ((index + Math.floor(t * 12)) % 3 !== 0 && petalPulse < 0.1 && speed < 0.85) {
      return;
    }

    const petalLength = 3.8 + speed * 1.2 + petalPulse * 12;
    const angle = Math.atan2(particle.y - particle.py, particle.x - particle.px || 0.001);
    const branch = 0.35 + particle.petalBias * 0.5;

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.09 + petalPulse * 0.22})`;
    ctx.lineWidth = 0.75 + particle.width * 0.28 + petalPulse * 0.8;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
      particle.x - Math.cos(angle) * petalLength,
      particle.y - Math.sin(angle) * petalLength,
    );
    ctx.stroke();

    if (petalPulse > 0.08) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + highReturn * 0.25})`;
      ctx.lineWidth = 0.55 + highReturn * 0.7;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x - Math.cos(angle - branch) * (petalLength * 0.65),
        particle.y - Math.sin(angle - branch) * (petalLength * 0.65),
      );
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x - Math.cos(angle + branch) * (petalLength * 0.65),
        particle.y - Math.sin(angle + branch) * (petalLength * 0.65),
      );
      ctx.stroke();
    }
  }

  function drawConstellationParticle(particle, detail) {
    const { energy, pulse, t, centroid, events } = detail;
    const highBeat = events.highBeat;
    const highReturn = events.highReturn;
    const bassReturn = events.bassReturn;
    const [r, g, b] = pickColor((particle.tint + t * 0.01 + centroid * 0.2 + highReturn * 0.18) % 1);
    const radius = 0.8 + particle.width * 0.45 + pulse * 0.35 + highBeat * 0.6 + bassReturn * 0.45;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.14 + highReturn * 0.18})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (highReturn > 0.08) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + highReturn * 0.2})`;
      ctx.lineWidth = 0.5 + highReturn * 0.7;
      ctx.beginPath();
      ctx.moveTo(particle.x - radius * 2.1, particle.y);
      ctx.lineTo(particle.x + radius * 2.1, particle.y);
      ctx.stroke();
    }
  }

  function getContrastState() {
    const { bass, mids, high, energy, pulse, presence, centroid } = state.audio;
    const bassBeat = getEventIntensity("bassBeat");
    const midsBeat = getEventIntensity("midsBeat");
    const highBeat = getEventIntensity("highBeat");
    const energyBeat = getEventIntensity("energyBeat");
    const bassReturn = getEventIntensity("bassReturn");
    const midsReturn = getEventIntensity("midsReturn");
    const highReturn = getEventIntensity("highReturn");
    const energyReturn = getEventIntensity("energyReturn");
    const silenceBreak = getEventIntensity("silenceBreak");
    const silence = clamp(
      1 - (energy * 1.08 + presence * 0.78 + mids * 0.22 + high * 0.18) + silenceBreak * 0.22,
      0,
      1,
    );
    const beatFlash = clamp(
      bassBeat * 0.92 + highBeat * 0.48 + energyBeat * 0.55 + pulse * 0.18,
      0,
      1,
    );

    return {
      bass,
      mids,
      high,
      energy,
      pulse,
      centroid,
      bassBeat,
      midsBeat,
      highBeat,
      energyBeat,
      bassReturn,
      midsReturn,
      highReturn,
      energyReturn,
      silenceBreak,
      silence,
      beatFlash,
    };
  }

  function drawSilenceMask(t, emphasis = 1) {
    const { silence, silenceBreak, centroid } = getContrastState();

    if (silence < 0.05) {
      return;
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((centroid * 0.4 + t * 0.01) % 1);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(3, 5, 8, ${0.02 + silence * 0.15 * emphasis})`;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.02 + silence * 0.12 + silenceBreak * 0.14})`;
    ctx.lineWidth = 0.7 + silence * 1.1;

    for (let i = 0; i < 3; i += 1) {
      const radius = Math.min(state.width, state.height) * (0.12 + i * 0.1 + silence * 0.05);
      ctx.beginPath();
      ctx.ellipse(
        center.x,
        center.y + i * 12,
        radius * (1 + i * 0.22),
        radius * (0.58 + i * 0.08),
        Math.sin(t * 0.18 + i) * 0.08,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.015 + silence * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(0, center.y);
    ctx.lineTo(state.width, center.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawBassAnchors(t, emphasis = 1) {
    const { bass, pulse, bassBeat, bassReturn, centroid } = getContrastState();

    if (bass + bassBeat + bassReturn < 0.06) {
      return;
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((centroid * 0.16 + bass * 0.1) % 1);
    const floorY = state.height * 0.82 - bassReturn * 24;
    const width = state.width * (0.2 + bass * 0.18 + bassReturn * 0.08) * emphasis;
    const height = state.height * (0.05 + bass * 0.04 + bassBeat * 0.02) * emphasis;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.03 + bass * 0.08 + bassReturn * 0.14})`;
    ctx.beginPath();
    ctx.ellipse(center.x, floorY + 20, width * 0.74, height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 2; i += 1) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + bassBeat * 0.18 + bassReturn * 0.16})`;
      ctx.lineWidth = 1.2 + i * 1.4 + bassBeat * 1.8 + bassReturn * 1.5;
      ctx.beginPath();
      ctx.ellipse(
        center.x,
        floorY - i * 12,
        width * (1 + i * 0.18),
        height * (1 + i * 0.22) + pulse * 14,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawMidRibbons(t, emphasis = 1, twist = 1) {
    const { mids, pulse, midsBeat, midsReturn, centroid } = getContrastState();

    if (mids + midsReturn + midsBeat < 0.05) {
      return;
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((0.18 + centroid * 0.22 + mids * 0.12) % 1);
    const amplitude = (16 + mids * 42 + midsReturn * 54 + midsBeat * 24) * emphasis;
    const travel = 0.4 + twist * 0.28;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.045 + mids * 0.1 + midsReturn * 0.14})`;
    ctx.lineWidth = 0.9 + mids * 1.5 + midsBeat * 0.9;

    for (let layer = 0; layer < 3; layer += 1) {
      const y = center.y + (layer - 1) * amplitude * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, y);

      for (let step = 1; step <= 12; step += 1) {
        const x = (step / 12) * state.width;
        const wave =
          Math.sin(step * 0.7 * twist + t * (travel + layer * 0.06)) * amplitude +
          Math.cos(step * 0.35 + t * (0.28 + mids * 0.4)) * amplitude * 0.36;
        ctx.lineTo(x, y + wave * (0.55 + layer * 0.12));
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHighSparks(t, emphasis = 1, radialBias = 1) {
    const { high, pulse, highBeat, highReturn, centroid } = getContrastState();

    if (high + highBeat + highReturn < 0.04) {
      return;
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((0.52 + centroid * 0.24 + highReturn * 0.14) % 1);
    const count = 6 + Math.round((high + highBeat + highReturn) * 10 * emphasis);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.045 + high * 0.12 + highReturn * 0.18})`;
    ctx.lineWidth = 0.7 + highBeat * 1.3 + highReturn * 0.9;

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + t * (0.24 + radialBias * 0.08);
      const inner = 28 + pulse * 18 + highReturn * 34;
      const outer = inner + 22 + high * 66 + highBeat * 38;
      const x1 = center.x + Math.cos(angle) * inner;
      const y1 = center.y + Math.sin(angle) * inner;
      const x2 = center.x + Math.cos(angle) * outer;
      const y2 = center.y + Math.sin(angle) * outer;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + highReturn * 0.22})`;
        ctx.beginPath();
        ctx.arc(x2, y2, 0.8 + highBeat * 0.8 + highReturn * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawBeatBeacon(t, emphasis = 1) {
    const { beatFlash, bassBeat, highBeat, energyBeat, bassReturn, highReturn, centroid } = getContrastState();

    if (beatFlash + bassReturn + highReturn < 0.06) {
      return;
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((centroid + beatFlash * 0.12 + t * 0.01) % 1);
    const white = 220 + Math.round(35 * Math.min(1, beatFlash + highBeat));

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(${white}, ${white}, ${white}, ${0.01 + beatFlash * 0.04 * emphasis})`;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + beatFlash * 0.2 + bassReturn * 0.14})`;
    ctx.lineWidth = 1.2 + bassBeat * 2.2 + energyBeat * 1.4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 34 + bassBeat * 120 + bassReturn * 52, 0, Math.PI * 2);
    ctx.stroke();

    if (highBeat > 0.05 || highReturn > 0.05) {
      ctx.strokeStyle = `rgba(${white}, ${white}, ${white}, ${0.06 + highBeat * 0.18 + highReturn * 0.14})`;
      ctx.lineWidth = 0.8 + highBeat * 1.1;

      for (let i = 0; i < 4; i += 1) {
        const angle = Math.PI * 0.25 + i * Math.PI * 0.5 + t * 0.15;
        const inner = 12 + bassReturn * 18;
        const outer = inner + 30 + highBeat * 44 + highReturn * 38;
        ctx.beginPath();
        ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
        ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawHalo(t) {
    const { spectrum, energy, pulse, centroid, presence } = state.audio;
    const cx = state.width * (0.5 + (centroid - 0.5) * 0.22);
    const cy = state.height * (0.5 + Math.sin(t * 0.55) * 0.03 * (presence + 0.15));
    const baseRadius = Math.min(state.width, state.height) * (0.16 + energy * 0.1);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let ring = 0; ring < 2; ring += 1) {
      const [r, g, b] = pickColor((ring * 0.3 + centroid + pulse * 0.2) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.18})`;
      ctx.lineWidth = 1.2 + ring * 1.4 + energy * 1.2;
      ctx.shadowBlur = 22 + energy * 28;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${0.24 + energy * 0.22})`;

      ctx.beginPath();

      for (let i = 0; i <= spectrum.length; i += 1) {
        const band = spectrum[i % spectrum.length];
        const angle = (i / spectrum.length) * Math.PI * 2;
        const radius =
          baseRadius * (1 + ring * 0.28) +
          band * (52 + ring * 24) +
          pulse * 12 * Math.sin(angle * 2 + t * 2.2);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSpectrumVeil() {
    const { spectrum, energy } = state.audio;
    const barWidth = state.width / spectrum.length;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < spectrum.length; i += 1) {
      const band = spectrum[i];
      const [r, g, b] = pickColor((i / spectrum.length + state.audio.centroid * 0.3) % 1);
      const height = band * state.height * 0.18;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.02 + energy * 0.06})`;
      ctx.fillRect(i * barWidth, state.height - height, Math.ceil(barWidth), height);
    }

    ctx.restore();
  }

  function drawRadialVeil(t) {
    const { spectrum, energy, high, pulse } = state.audio;
    const center = getAudioCenter(t);
    const baseRadius = Math.min(state.width, state.height) * (0.12 + energy * 0.08);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < spectrum.length; i += 1) {
      const band = spectrum[i];
      const angle = (i / spectrum.length) * Math.PI * 2 + t * (0.06 + high * 0.08);
      const inner = baseRadius * 0.55;
      const outer = inner + band * 180 + pulse * 28;
      const [r, g, b] = pickColor((i / spectrum.length + pulse * 0.1) % 1);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + band * 0.18})`;
      ctx.lineWidth = 0.8 + band * 2.2;
      ctx.beginPath();
      ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
      ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPulseGrid() {
    const { spectrum, bass, high, pulse, centroid, energy } = state.audio;
    const cols = 18;
    const rows = 14;
    const now = performance.now();

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let row = 0; row <= rows; row += 1) {
      ctx.beginPath();

      for (let col = 0; col <= cols; col += 1) {
        const baseX = (col / cols) * state.width;
        const baseY = (row / rows) * state.height;
        const band = spectrum[Math.floor((col / cols) * (spectrum.length - 1))];
        const offsetX =
          Math.sin(row * 0.52 + baseX * 0.002 + now * 0.0012 * (1 + high)) * (12 + band * 34) +
          (centroid - 0.5) * 38;
        const offsetY =
          Math.cos(col * 0.35 - now * 0.0009 * (1 + bass * 1.6)) * (8 + band * 28) +
          pulse * 16 * Math.sin(col * 0.4 + row * 0.18);
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        if (col === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const [r, g, b] = pickColor((row / rows + state.audio.centroid * 0.18) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + energy * 0.08})`;
      ctx.lineWidth = 0.9 + pulse * 0.7;
      ctx.stroke();
    }

    for (let col = 0; col <= cols; col += 1) {
      ctx.beginPath();

      for (let row = 0; row <= rows; row += 1) {
        const baseX = (col / cols) * state.width;
        const baseY = (row / rows) * state.height;
        const band = spectrum[Math.floor((row / rows) * (spectrum.length - 1))];
        const offsetX =
          Math.sin(row * 0.48 + baseY * 0.0016 + now * 0.001) * (10 + band * 24) +
          (centroid - 0.5) * 30;
        const offsetY =
          Math.cos(col * 0.42 - now * 0.0011 * (1 + high)) * (12 + band * 30) +
          pulse * 12 * Math.sin(row * 0.44);
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        if (row === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const [r, g, b] = pickColor((col / cols + 0.14 + state.audio.centroid * 0.2) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.035 + energy * 0.065})`;
      ctx.lineWidth = 0.85 + pulse * 0.55;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawKaleidoOverlay(t) {
    const { spectrum, high, pulse, energy } = state.audio;
    const center = getAudioCenter(t);
    const highReturn = getEventIntensity("highReturn");
    const bassReturn = getEventIntensity("bassReturn");
    const highBeat = getEventIntensity("highBeat");
    drawSilenceMask(t, 0.55);
    drawBassAnchors(t, 0.42);
    drawMidRibbons(t, 0.58, 1.35);
    drawHighSparks(t, 1.1, 1.5);
    drawBeatBeacon(t, 0.75);
    const petals = 6 + Math.round(high * 4);
    const baseRadius = Math.min(state.width, state.height) * (0.12 + energy * 0.07 + highReturn * 0.04);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let ring = 0; ring < 2; ring += 1) {
      const [r, g, b] = pickColor((ring * 0.18 + pulse * 0.18 + state.audio.centroid * 0.24) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.07 + energy * 0.14})`;
      ctx.lineWidth = 1.1 + ring * 1.2 + pulse * 0.8;
      ctx.beginPath();

      for (let i = 0; i <= spectrum.length; i += 1) {
        const band = spectrum[i % spectrum.length];
        const angle = (i / spectrum.length) * Math.PI * 2;
        const radius =
          baseRadius * (1 + ring * 0.34) +
          Math.sin(angle * petals + t * (0.8 + ring * 0.25)) * (18 + band * 52) +
          band * 38 +
          pulse * 16;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    if (highReturn > 0.05 || bassReturn > 0.05) {
      const spokeCount = 8 + Math.round(highReturn * 10);
      const [r, g, b] = pickColor((state.audio.centroid + highReturn * 0.18 + bassReturn * 0.1) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + highReturn * 0.24})`;
      ctx.lineWidth = 0.8 + highBeat * 1.4 + highReturn * 1.1;

      for (let i = 0; i < spokeCount; i += 1) {
        const angle = (i / spokeCount) * Math.PI * 2 + t * 0.22;
        const inner = baseRadius * (0.5 + bassReturn * 0.22);
        const outer = inner + 54 + highReturn * 88;
        ctx.beginPath();
        ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
        ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }

    ctx.restore();
    drawReactors(t, 0.55);
  }

  function drawGridOverlay(t) {
    const center = getAudioCenter(t);
    const { pulse, energy } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const highBeat = getEventIntensity("highBeat");
    drawSilenceMask(t, 0.72);
    drawBassAnchors(t, 0.76);
    drawMidRibbons(t, 0.46, 0.82);
    drawHighSparks(t, 0.5, 0.9);
    drawBeatBeacon(t, 0.82);
    const [r, g, b] = pickColor((state.audio.centroid + pulse * 0.14) % 1);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + energy * 0.18})`;
    ctx.lineWidth = 1.2 + pulse * 1.2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 52 + energy * 90 + pulse * 32, 0, Math.PI * 2);
    ctx.stroke();

    if (bassReturn > 0.05 || highReturn > 0.05) {
      const scanCount = 3 + Math.round(highReturn * 4);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + bassReturn * 0.16 + highReturn * 0.12})`;
      ctx.lineWidth = 0.7 + bassReturn * 1.6;

      for (let i = 0; i < scanCount; i += 1) {
        const y = center.y + (i - (scanCount - 1) / 2) * (18 + highBeat * 10);
        const width = 110 + bassReturn * 180 + highReturn * 120;
        ctx.beginPath();
        ctx.moveTo(center.x - width, y);
        ctx.lineTo(center.x + width, y);
        ctx.stroke();
      }
    }

    ctx.restore();

    drawReactors(t, 0.4);
  }

  function drawMistVeil(t) {
    const center = getAudioCenter(t);
    const { bass, high, energy, pulse } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const radius =
      Math.min(state.width, state.height) * (0.26 + bass * 0.14 + pulse * 0.05 + bassReturn * 0.12);
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    const [r, g, b] = pickColor((state.audio.centroid + t * 0.01 + bassReturn * 0.12) % 1);

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.1 + bassReturn * 0.18})`);
    gradient.addColorStop(0.52, `rgba(${r}, ${g}, ${b}, ${0.022 + high * 0.04 + highReturn * 0.09})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.restore();
  }

  function drawBloomOverlay(t) {
    const center = getAudioCenter(t);
    const { bass, mids, high, pulse, energy } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const bassBeat = getEventIntensity("bassBeat");
    const highBeat = getEventIntensity("highBeat");
    drawSilenceMask(t, 0.5);
    drawBassAnchors(t, 0.84);
    drawMidRibbons(t, 1.12, 0.95);
    drawHighSparks(t, 0.7, 1.08);
    drawBeatBeacon(t, 0.68);
    const petalCount = 5 + Math.round(mids * 4 + highReturn * 2);
    const lobedRadius = 72 + bass * 38 + bassReturn * 58 + pulse * 22;
    const flare = Math.max(highBeat, highReturn * 0.9);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let layer = 0; layer < 2; layer += 1) {
      const [r, g, b] = pickColor((layer * 0.16 + pulse * 0.12 + bassReturn * 0.18) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + energy * 0.1 + bassReturn * 0.16})`;
      ctx.lineWidth = 1.15 + bassReturn * 1.8 - layer * 0.08;
      ctx.beginPath();

      for (let step = 0; step <= 28; step += 1) {
        const angle = (step / 28) * Math.PI * 2;
        const lobe =
          1 +
          Math.sin(angle * petalCount - t * (0.6 + high * 1.1)) * (0.12 + highReturn * 0.2) +
          Math.cos(angle * (petalCount * 0.5) + t * 0.45) * (0.04 + bassBeat * 0.08);
        const radius = lobedRadius * (1 + layer * 0.18) * lobe;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius * (0.84 + layer * 0.06);

        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    if (flare > 0.05) {
      const [r, g, b] = pickColor((state.audio.centroid + flare * 0.2) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + flare * 0.2})`;
      ctx.lineWidth = 1 + flare * 1.4;

      for (let i = 0; i < petalCount; i += 1) {
        const angle = (i / petalCount) * Math.PI * 2 + t * 0.18;
        const inner = 36 + bassReturn * 18;
        const outer = inner + 42 + flare * 62;
        ctx.beginPath();
        ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
        ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }

    for (const reactor of state.reactors) {
      const [r, g, b] = pickColor((reactor.band + pulse * 0.2 + highReturn * 0.1) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.035 + reactor.band * 0.12 + bassReturn * 0.08})`;
      ctx.lineWidth = 0.8 + reactor.band * 1.2;
      ctx.beginPath();
      ctx.arc(reactor.x, reactor.y, reactor.radius * (1.15 + bassReturn * 0.18), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    drawReactors(t, 0.52);
  }

  function drawStarfield(t) {
    const center = getAudioCenter(t);
    const { spectrum, energy, presence } = state.audio;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < spectrum.length; i += 1) {
      const band = spectrum[i];
      const angle = (i / spectrum.length) * Math.PI * 2 + t * (0.03 + presence * 0.06);
      const radius = Math.min(state.width, state.height) * (0.24 + band * 0.5) + (i % 6) * 18;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius * 0.72;
      const [r, g, b] = pickColor((i / spectrum.length + state.audio.centroid * 0.18) % 1);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + band * 0.18})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.7 + band * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawConstellationOverlay(t) {
    const highBeat = getEventIntensity("highBeat");
    const highReturn = getEventIntensity("highReturn");
    const bassReturn = getEventIntensity("bassReturn");
    drawSilenceMask(t, 0.98);
    drawBassAnchors(t, 0.58);
    drawMidRibbons(t, 0.42, 0.72);
    drawHighSparks(t, 1.28, 1.85);
    drawBeatBeacon(t, 0.78);
    const maxNodes = 40 + Math.round(highReturn * 10);
    const sampleStep = Math.max(1, Math.floor(state.particles.length / maxNodes));
    const nodes = [];

    for (let i = 0; i < state.particles.length && nodes.length < maxNodes; i += sampleStep) {
      nodes.push(state.particles[i]);
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const maxDistance = 82 + highReturn * 26 + bassReturn * 18;
    const maxDistanceSq = maxDistance * maxDistance;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq > maxDistanceSq) {
          continue;
        }

        const alpha = (1 - distanceSq / maxDistanceSq) * (0.024 + state.audio.energy * 0.09 + highReturn * 0.12);
        const [r, g, b] = pickColor((i / nodes.length + state.audio.centroid * 0.2) % 1);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 0.55 + state.audio.pulse * 0.65 + highBeat * 0.8;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    const center = getAudioCenter(t);
    const [r, g, b] = pickColor((state.audio.centroid + state.audio.pulse * 0.12) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + state.audio.energy * 0.14 + bassReturn * 0.18})`;
    ctx.lineWidth = 1.1 + state.audio.pulse * 0.9 + bassReturn * 1.2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 74 + state.audio.mids * 90 + bassReturn * 42, 0, Math.PI * 2);
    ctx.stroke();

    if (highReturn > 0.05 || bassReturn > 0.05) {
      const spokeCount = 5 + Math.round(highReturn * 6);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + highReturn * 0.24})`;
      ctx.lineWidth = 0.7 + highReturn * 1.1;

      for (let i = 0; i < spokeCount; i += 1) {
        const angle = (i / spokeCount) * Math.PI * 2 + t * 0.12;
        const inner = 16 + bassReturn * 30;
        const outer = inner + 48 + highReturn * 96;
        ctx.beginPath();
        ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
        ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }

    ctx.restore();
    drawReactors(t, 0.36);
  }

  function drawFlowOverlay(t) {
    const center = getAudioCenter(t);
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const bassBeat = getEventIntensity("bassBeat");

    drawSilenceMask(t, 0.96);
    drawBassAnchors(t, 1.12);
    drawMidRibbons(t, 0.84, 0.78);
    drawHighSparks(t, 0.94, 1.15);
    drawBeatBeacon(t, 1.04);
    drawHalo(t);

    if (bassReturn > 0.05 || highReturn > 0.05) {
      const [r, g, b] = pickColor((state.audio.centroid + bassReturn * 0.18 + highReturn * 0.12) % 1);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + bassReturn * 0.22 + highReturn * 0.12})`;
      ctx.lineWidth = 1 + bassBeat * 1.1 + bassReturn * 1.8;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 40 + bassReturn * 120 + highReturn * 44, 0, Math.PI * 2);
      ctx.stroke();

      if (highReturn > 0.08) {
        const spokeCount = 6 + Math.round(highReturn * 6);

        for (let i = 0; i < spokeCount; i += 1) {
          const angle = (i / spokeCount) * Math.PI * 2 + t * 0.2;
          const inner = 22 + bassReturn * 24;
          const outer = inner + 36 + highReturn * 64;
          ctx.beginPath();
          ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
          ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    drawReactors(t, 1);
  }

  function drawFaultBands(t) {
    const { spectrum, energy, bass, high, centroid, pulse } = state.audio;
    const silence = getContrastState().silence;
    const lanes = 7;
    const steps = 8;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let lane = 0; lane < lanes; lane += 1) {
      const laneRatio = lanes > 1 ? lane / (lanes - 1) : 0;
      const baseY = state.height * (0.12 + laneRatio * 0.76);
      const band = spectrum[Math.floor(laneRatio * (spectrum.length - 1))];
      const [r, g, b] = pickColor((lane / lanes + centroid * 0.18 + high * 0.1) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.03 + energy * 0.07 + band * 0.05 - silence * 0.018})`;
      ctx.lineWidth = 0.9 + band * 2 + high * 0.45;
      ctx.beginPath();

      for (let step = 0; step <= steps; step += 1) {
        const x = (step / steps) * state.width;
        const shard =
          Math.sign(Math.sin(step * 1.9 + lane * 0.6 + t * (1.3 + high * 1.6))) *
            (20 + band * 48 + high * 24) +
          Math.round(Math.sin(step * 0.55 + lane * 0.4 + t * 0.38)) * (6 + bass * 18 + pulse * 10) +
          Math.cos(step * 0.5 + t * 0.45) * (5 + bass * 14);
        const y = baseY + shard;

        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFaultParticle(particle, detail) {
    const { speed, t, energy, centroid, events } = detail;
    const highBeat = events.highBeat;
    const highReturn = events.highReturn;
    const energyBeat = events.energyBeat;

    if (speed < 0.5 && highBeat < 0.08 && highReturn < 0.08 && energyBeat < 0.08) {
      return;
    }

    const [r, g, b] = pickColor((particle.tint + centroid * 0.24 + t * 0.02 + highReturn * 0.16) % 1);
    const angle = Math.atan2(particle.y - particle.py, particle.x - particle.px || 0.001);
    const length = 4 + speed * 1.6 + highBeat * 6.2 + energyBeat * 4.2;

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + energy * 0.1 + highReturn * 0.14})`;
    ctx.lineWidth = 0.8 + particle.width * 0.45 + highBeat * 0.85;
    ctx.beginPath();
    ctx.moveTo(particle.x - Math.cos(angle) * length, particle.y - Math.sin(angle) * length);
    ctx.lineTo(particle.x + Math.cos(angle) * length, particle.y + Math.sin(angle) * length);
    ctx.stroke();

    if (highBeat > 0.08 || energyBeat > 0.08) {
      const tick = 1.6 + highBeat * 3.4 + energyBeat * 2.6;
      ctx.beginPath();
      ctx.moveTo(
        particle.x - Math.cos(angle + Math.PI * 0.5) * tick,
        particle.y - Math.sin(angle + Math.PI * 0.5) * tick,
      );
      ctx.lineTo(
        particle.x + Math.cos(angle + Math.PI * 0.5) * tick,
        particle.y + Math.sin(angle + Math.PI * 0.5) * tick,
      );
      ctx.stroke();
    }
  }

  function drawFaultOverlay(t) {
    const center = getAudioCenter(t);
    const { bass, energy, high, pulse, centroid } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    drawSilenceMask(t, 0.84);
    drawBeatBeacon(t, 0.72);

    const [r, g, b] = pickColor((0.28 + centroid * 0.2 + high * 0.16) % 1);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.14})`;
    ctx.lineWidth = 1.2 + pulse * 1.4;

    for (let layer = 0; layer < 3; layer += 1) {
      const jitter = 26 + layer * 20 + high * 34 + highReturn * 16;
      ctx.beginPath();

      for (let step = 0; step <= 8; step += 1) {
        const x = (step / 8) * state.width;
        const y =
          center.y +
          (step % 2 === 0 ? -1 : 1) * jitter +
          Math.sign(Math.sin(step * 0.8 + t * (0.8 + layer * 0.18))) * (12 + energy * 22 + bass * 10);

        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    const crackCount = 3;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + highReturn * 0.16 + bassReturn * 0.1})`;
    ctx.lineWidth = 0.8 + high * 0.8 + highReturn * 0.6;

    for (let i = 0; i < crackCount; i += 1) {
      const originX = state.width * (0.2 + i * 0.3);
      ctx.beginPath();
      ctx.moveTo(originX, state.height * (0.1 + i * 0.08));

      for (let step = 1; step <= 5; step += 1) {
        const x = originX + Math.sin(step * 1.1 + i + t * 0.5) * (30 + high * 42);
        const y = state.height * (0.12 + i * 0.12 + step * 0.13) + Math.cos(step + t * 0.4) * 12;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    ctx.restore();
    drawReactors(t, 0.26);
  }

  function drawTideglassBackdrop(t) {
    const { spectrum, bass, mids, high, energy, centroid } = state.audio;
    const lanes = 5;
    const steps = 12;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let lane = 0; lane < lanes; lane += 1) {
      const laneRatio = lanes > 1 ? lane / (lanes - 1) : 0;
      const y = state.height * (0.18 + laneRatio * 0.56);
      const band = spectrum[Math.floor(laneRatio * (spectrum.length - 1))];
      const [r, g, b] = pickColor((0.08 + lane * 0.1 + centroid * 0.16) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.03 + energy * 0.06 + band * 0.06})`;
      ctx.lineWidth = 1.4 + band * 3;
      ctx.beginPath();

      for (let step = 0; step <= steps; step += 1) {
        const x = (step / steps) * state.width;
        const wave =
          Math.sin(step * 0.8 + t * (0.86 + high * 1.28) + lane * 0.7) * (15 + mids * 30 + band * 28) +
          Math.cos(step * 0.22 - t * (0.42 + bass * 1.02)) * (10 + band * 20 + bass * 10);

        if (step === 0) {
          ctx.moveTo(x, y + wave);
        } else {
          ctx.lineTo(x, y + wave);
        }
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTideglassParticle(particle, detail) {
    const { speed, t, mids, high, pulse, index, events } = detail;
    const bassReturn = events.bassReturn;
    const highReturn = events.highReturn;
    const highBeat = events.highBeat;

    if (speed < 0.42 && pulse < 0.05 && bassReturn < 0.08 && highBeat < 0.08 && index % 2 === 0) {
      return;
    }

    const [r, g, b] = pickColor((particle.tint + t * 0.016 + mids * 0.2 + high * 0.12) % 1);
    const drift = 1.5 + speed * 1.1 + bassReturn * 3.6 + highBeat * 2.2 + highReturn * 1.8;

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + pulse * 0.08 + high * 0.08 + highReturn * 0.08})`;
    ctx.lineWidth = 0.8 + particle.width * 0.32 + highBeat * 0.34;
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);
    ctx.bezierCurveTo(
      particle.px + drift * 0.4,
      particle.py - drift * 0.28,
      particle.x - drift,
      particle.y - drift * 0.24,
      particle.x,
      particle.y,
    );
    ctx.stroke();

    if (highBeat > 0.08 || highReturn > 0.08) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + highBeat * 0.12 + highReturn * 0.16})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 0.7 + highBeat * 0.8 + highReturn * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTideglassOverlay(t) {
    const center = getAudioCenter(t);
    const { bass, mids, high, pulse, centroid, energy } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const highBeat = getEventIntensity("highBeat");
    drawSilenceMask(t, 0.52);
    drawBeatBeacon(t, 0.54);

    const [r, g, b] = pickColor((0.12 + centroid * 0.2 + bass * 0.08) % 1);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + bass * 0.12 + mids * 0.08 + highReturn * 0.08})`;
    ctx.lineWidth = 1 + pulse * 1 + highBeat * 0.4;

    for (let i = 0; i < 3; i += 1) {
      const panelWidth = 72 + bass * 44 + bassReturn * 52 + i * 12;
      const panelHeight = state.height * (0.24 + mids * 0.12 + i * 0.03);
      const x = center.x - panelWidth * 0.5 + (i - 1) * (panelWidth * 0.7);
      const y = center.y - panelHeight * 0.48 + i * 14;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.016 + energy * 0.035 + bassReturn * 0.05})`;
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.strokeRect(x, y, panelWidth, panelHeight);
    }

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + high * 0.08 + highReturn * 0.14})`;
    ctx.lineWidth = 0.9 + highBeat * 0.8 + highReturn * 0.55;

    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(
        center.x,
        center.y + i * 18,
        42 + i * 24 + bass * 40 + bassReturn * 30 + high * 18,
        Math.PI * 0.08,
        Math.PI * 0.92,
      );
      ctx.stroke();
    }

    ctx.restore();
    drawReactors(t, 0.24);
  }

  function drawMonolithBackdrop(t) {
    const { spectrum, bass, high, energy, centroid } = state.audio;
    const columns = 11;
    const gap = state.width / columns;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let column = 0; column < columns; column += 1) {
      const band = spectrum[Math.floor((column / (columns - 1)) * (spectrum.length - 1))];
      const width = gap * 0.62;
      const height = state.height * (0.18 + bass * 0.32 + band * 0.48 + energy * 0.08);
      const x = gap * column + gap * 0.19 + Math.sin(t * 0.22 + column) * 10 * (centroid - 0.5);
      const y = state.height - height;
      const [r, g, b] = pickColor((0.08 + column / columns + centroid * 0.1) % 1);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.02 + band * 0.06 + bass * 0.05})`;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + energy * 0.07 + high * 0.08})`;
      ctx.lineWidth = 1 + band * 0.8;
      ctx.strokeRect(x, y, width, height);

      if (high > 0.05) {
        const cuts = 1 + Math.round(high * 3);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + high * 0.14})`;
        ctx.lineWidth = 0.65 + high * 0.5;

        for (let cut = 0; cut < cuts; cut += 1) {
          const cutY = y + height * (0.18 + ((cut + 1) / (cuts + 1)) * 0.68);
          ctx.beginPath();
          ctx.moveTo(x + 6, cutY);
          ctx.lineTo(x + width - 6, cutY);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  function drawMonolithParticle(particle, detail) {
    const { speed, bass, mids, t, events } = detail;
    const bassBeat = events.bassBeat;
    const energyBeat = events.energyBeat;
    const highReturn = events.highReturn;
    const [r, g, b] = pickColor((particle.tint + bass * 0.18 + mids * 0.1 + t * 0.01) % 1);
    const width = 1.6 + particle.width * 0.7 + bassBeat * 1.4;
    const height = 3.6 + speed * 1.4 + mids * 2.4 + energyBeat * 5;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + bass * 0.08 + energyBeat * 0.12 + highReturn * 0.08})`;
    ctx.fillRect(particle.x - width * 0.5, particle.y - height, width, height);

    if (highReturn > 0.08) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + highReturn * 0.18})`;
      ctx.lineWidth = 0.65 + highReturn * 0.8;
      ctx.beginPath();
      ctx.moveTo(particle.x - width * 1.2, particle.y - height * 0.42);
      ctx.lineTo(particle.x + width * 1.2, particle.y - height * 0.42);
      ctx.stroke();
    }
  }

  function drawMonolithOverlay(t) {
    const center = getAudioCenter(t);
    const { bass, energy, pulse, centroid } = state.audio;
    const bassBeat = getEventIntensity("bassBeat");
    const bassReturn = getEventIntensity("bassReturn");
    const energyBeat = getEventIntensity("energyBeat");
    drawSilenceMask(t, 0.46);
    drawBeatBeacon(t, 0.6);

    const [r, g, b] = pickColor((0.22 + centroid * 0.16 + bass * 0.1) % 1);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + energy * 0.14 + bassReturn * 0.16})`;

    for (let layer = 0; layer < 4; layer += 1) {
      const width = state.width * (0.14 + layer * 0.08 + bass * 0.03);
      const height = state.height * (0.22 + energy * 0.12 + layer * 0.05);
      const x = center.x - width * 0.5;
      const y = state.height - height - layer * 14 - bassReturn * 18;
      ctx.lineWidth = 1.2 + layer * 0.18 + bassBeat * 1.1;
      ctx.strokeRect(x, y, width, height);
    }

    if (energyBeat > 0.05) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.03 + energyBeat * 0.08})`;
      ctx.fillRect(0, state.height * (0.18 + Math.sin(t * 0.24) * 0.06), state.width, 16 + energyBeat * 22);
    }

    ctx.restore();
    drawReactors(t, 0.18);
  }

  function drawTopographBackdrop(t) {
    const center = getAudioCenter(t);
    const { spectrum, bass, mids, high, centroid, pulse } = state.audio;
    const layers = 8;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let layer = 0; layer < layers; layer += 1) {
      const [r, g, b] = pickColor((0.24 + layer * 0.07 + centroid * 0.18) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.03 + mids * 0.05 + layer * 0.003})`;
      ctx.lineWidth = 0.7 + (layer % 3 === 0 ? 0.45 : 0) + high * 0.38;
      ctx.beginPath();

      for (let step = 0; step <= 56; step += 1) {
        const angle = (step / 56) * Math.PI * 2;
        const band = spectrum[(step + layer * 3) % spectrum.length];
        const ridge =
          Math.sin(angle * 3 + t * (0.16 + layer * 0.02)) * (8 + mids * 24) +
          Math.cos(angle * 5 - t * 0.12) * (4 + high * 18);
        const radius =
          48 + layer * 24 + band * 24 + bass * 28 + ridge + pulse * 8 * Math.sin(angle * 2 + t * 0.2);
        const x = center.x + Math.cos(angle) * radius * (1.06 + layer * 0.012);
        const y = center.y + Math.sin(angle) * radius * (0.68 + layer * 0.022);

        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTopographParticle(particle, detail) {
    const { speed, mids, high, t, centroid, index, events } = detail;
    const midsReturn = events.midsReturn;
    const highReturn = events.highReturn;
    const [r, g, b] = pickColor((particle.tint + centroid * 0.18 + mids * 0.18 + t * 0.012) % 1);
    const angle = Math.atan2(particle.y - particle.py, particle.x - particle.px || 0.001);
    const dash = 3.2 + speed * 1.3 + midsReturn * 5.4;

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + mids * 0.08 + highReturn * 0.12})`;
    ctx.lineWidth = 0.62 + particle.width * 0.3 + high * 0.2;
    ctx.beginPath();
    ctx.moveTo(
      particle.x - Math.cos(angle) * dash,
      particle.y - Math.sin(angle) * dash,
    );
    ctx.lineTo(
      particle.x + Math.cos(angle) * dash * 0.35,
      particle.y + Math.sin(angle) * dash * 0.35,
    );
    ctx.stroke();

    if ((midsReturn > 0.08 || highReturn > 0.08) && index % 5 === 0) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + midsReturn * 0.12 + highReturn * 0.1})`;
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
    }
  }

  function drawTopographOverlay(t) {
    const center = getAudioCenter(t);
    const { mids, high, energy, centroid } = state.audio;
    const midsReturn = getEventIntensity("midsReturn");
    const highReturn = getEventIntensity("highReturn");
    const silenceBreak = getEventIntensity("silenceBreak");
    drawSilenceMask(t, 0.78);
    drawBeatBeacon(t, 0.42);

    const [r, g, b] = pickColor((0.36 + centroid * 0.16 + mids * 0.12) % 1);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.045 + mids * 0.08 + midsReturn * 0.14})`;
    ctx.lineWidth = 0.8 + high * 0.45 + highReturn * 0.45;

    for (let i = -2; i <= 2; i += 1) {
      const offset = i * (40 + midsReturn * 12);
      ctx.beginPath();
      ctx.moveTo(center.x + offset, center.y - 150 - silenceBreak * 20);
      ctx.lineTo(center.x + offset, center.y + 150 + silenceBreak * 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center.x - 180 - silenceBreak * 24, center.y + offset);
      ctx.lineTo(center.x + 180 + silenceBreak * 24, center.y + offset);
      ctx.stroke();
    }

    if (midsReturn > 0.05 || highReturn > 0.05) {
      const markerRadius = 18 + midsReturn * 40 + highReturn * 22;

      for (let i = 0; i < 3; i += 1) {
        const mx = center.x + (i - 1) * 110;
        const my = center.y + Math.sin(t * 0.3 + i) * 34;
        ctx.beginPath();
        ctx.arc(mx, my, markerRadius * (0.7 + i * 0.12), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
    drawReactors(t, 0.22);
  }

  function sampleFlowField(x, y, t) {
    const nx = x / state.width - 0.5;
    const ny = y / state.height - 0.5;
    const { bass, mids, high, energy, centroid, pulse } = state.audio;
    const drift = (centroid - 0.5) * 2.2;

    const wave =
      Math.sin(nx * (7 + high * 11) - t * (0.45 + bass * 1.35)) +
      Math.cos(ny * (8 + mids * 9.5) + t * (0.32 + high * 1.2)) +
      Math.sin((nx + ny) * (5.6 + bass * 8.2) + t * (0.28 + energy * 1.6));

    let fx = Math.cos(wave * Math.PI);
    let fy = Math.sin(wave * Math.PI);

    fx += -ny * (0.7 + mids * 1.5 + pulse * 0.8) + drift * 0.42;
    fy += nx * (0.7 + mids * 1.5 + pulse * 0.8) + Math.sin(t * 0.7 + x * 0.002) * 0.08;

    const reactor = getReactorInfluence(x, y, 1, 1);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleKaleidoField(x, y, t) {
    const center = getAudioCenter(t);
    const dx = x - center.x;
    const dy = y - center.y;
    const radius = Math.hypot(dx, dy) + 1;
    const angle = Math.atan2(dy, dx);
    const { bass, mids, high, energy, pulse } = state.audio;
    const petals = 4 + Math.round(high * 6 + pulse * 2.5);
    const fold = Math.sin(angle * petals + t * (0.9 + bass * 2.4));
    const banding = Math.cos(radius * (0.014 + mids * 0.009) - t * (0.8 + high * 1.7));
    let fx = (-dy / radius) * (1.3 + high * 2.2 + pulse * 1.4);
    let fy = (dx / radius) * (1.3 + high * 2.2 + pulse * 1.4);

    fx += (dx / radius) * fold * (0.8 + bass * 1.5);
    fy += (dy / radius) * fold * (0.8 + bass * 1.5);
    fx += (dx / radius) * banding * (0.7 + energy * 1.3);
    fy += (dy / radius) * banding * (0.7 + energy * 1.3);

    const reactor = getReactorInfluence(x, y, 0.82, 1.35);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function samplePulseGridField(x, y, t) {
    const center = getAudioCenter(t);
    const { bass, mids, high, energy, pulse, centroid } = state.audio;
    const cell = 32 + (1 - energy) * 22 + mids * 12;
    const gx = (x - center.x) / cell;
    const gy = (y - center.y) / cell;
    const waveX =
      Math.sin(gy * (1.4 + high * 2.1) + t * (1.1 + high * 1.8)) +
      Math.cos(gx * 0.8 - t * (0.55 + bass * 1.5));
    const waveY =
      Math.cos(gx * (1.2 + mids * 1.6) - t * (0.75 + bass * 1.1)) -
      Math.sin(gy * 0.95 + t * (0.5 + high * 1.3));

    let fx = Math.sign(waveX) * (0.65 + Math.abs(waveX)) + -gy * (0.08 + pulse * 0.4);
    let fy = Math.sign(waveY) * (0.65 + Math.abs(waveY)) + gx * (0.08 + pulse * 0.4);

    fx += (centroid - 0.5) * 1.4;
    fy += Math.sin(t * 0.65 + gx) * 0.32;

    const reactor = getReactorInfluence(x, y, 0.55, 0.45);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleBloomField(x, y, t) {
    const center = getAudioCenter(t);
    const dx = x - center.x;
    const dy = y - center.y;
    const radius = Math.hypot(dx, dy) + 1;
    const angle = Math.atan2(dy, dx);
    const { bass, mids, high, pulse } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const petals = 5 + Math.round(mids * 4 + highReturn * 2);
    const inhale = Math.sin(radius * 0.019 - t * (1.2 + bass * 1.9 + bassReturn * 0.8));
    const petalFold = Math.cos(angle * petals - t * (0.34 + high * 0.92 + highReturn * 0.4));
    const drift = Math.sin((dx + dy) * 0.005 + t * 0.4) * (0.25 + highReturn * 0.55);
    let fx = (dx / radius) * inhale * (1.05 + bass * 1.7 + bassReturn * 1.8);
    let fy = (dy / radius) * inhale * (1.05 + bass * 1.7 + bassReturn * 1.8);

    fx += (-dy / radius) * petalFold * (0.48 + mids * 0.92 + highReturn * 1.15) + drift;
    fy += (dx / radius) * petalFold * (0.48 + mids * 0.92 + highReturn * 1.15) - drift;

    const reactor = getReactorInfluence(x, y, 0.9, 0.72);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleConstellationField(x, y, t) {
    const center = getAudioCenter(t);
    const dx = x - center.x;
    const dy = y - center.y;
    const radius = Math.hypot(dx, dy) + 1;
    const { mids, high, centroid, pulse } = state.audio;
    let fx = (-dy / (radius + 90)) * (18 + mids * 28);
    let fy = (dx / (radius + 90)) * (18 + mids * 28);

    fx += Math.sin(t * 0.7 + y * 0.006) * (0.55 + high * 1.1) + (centroid - 0.5) * 1.2;
    fy += Math.cos(t * 0.55 + x * 0.006) * (0.55 + high * 1.1) + pulse * 0.35;

    const reactor = getReactorInfluence(x, y, 0.7, 0.65);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleFaultlineField(x, y, t) {
    const nx = x / state.width - 0.5;
    const ny = y / state.height - 0.5;
    const { bass, mids, high, energy, pulse, centroid } = state.audio;
    const fracture =
      Math.sign(Math.sin((nx + ny) * (10 + high * 10) + t * (2.1 + high * 1.2))) *
      (0.8 + high * 1.4 + energy * 0.4);
    const drift =
      Math.sign(Math.cos((nx - ny) * (8 + mids * 6) - t * (1.1 + bass * 1.4))) *
      (0.7 + mids * 0.9);
    let fx = fracture * (1.4 + pulse * 0.8) + (centroid - 0.5) * 1.6;
    let fy = drift * (1.1 + bass * 1.4) + Math.sin(t * 0.55 + x * 0.003) * 0.3;

    const reactor = getReactorInfluence(x, y, 0.6, 0.38);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleTideglassField(x, y, t) {
    const nx = x / state.width;
    const ny = y / state.height;
    const { bass, mids, high, pulse, centroid } = state.audio;
    const wave =
      Math.sin(nx * (9 + mids * 8) - t * (1.2 + bass * 1.2)) +
      Math.cos(ny * (8 + high * 6) + t * (0.8 + high * 1.1));
    let fx = Math.cos(wave) * (0.8 + mids * 1.1) + (centroid - 0.5) * 1.25;
    let fy = Math.sin(wave) * (0.4 + high * 0.65) + Math.sin(nx * 11 - t * (1.1 + bass)) * (0.9 + bass * 1.3);
    fy += pulse * 0.42 - 0.15;

    const reactor = getReactorInfluence(x, y, 0.52, 0.74);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleMonolithField(x, y, t) {
    const { bass, mids, high, pulse, energy, centroid } = state.audio;
    const cell = state.width / (7 + Math.round(mids * 4));
    const targetX = (Math.floor(x / cell) + 0.5) * cell;
    let fx = clamp((targetX - x) / Math.max(cell, 1), -1, 1) * (1.4 + mids * 1.4);
    let fy = -0.42 + bass * 1.5 + pulse * 0.62 + Math.sin(x * 0.014 + t * (0.6 + high * 0.4)) * (0.22 + energy * 0.5);

    fx += Math.sign(Math.sin(y * 0.018 - t * (1 + high * 1.3))) * (0.3 + high * 0.7);
    fx += (centroid - 0.5) * 1.2;

    const reactor = getReactorInfluence(x, y, 0.34, 0.18);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  function sampleTopographField(x, y, t) {
    const center = getAudioCenter(t);
    const dx = x - center.x;
    const dy = y - center.y;
    const radius = Math.hypot(dx, dy) + 1;
    const angle = Math.atan2(dy, dx);
    const { bass, mids, high, pulse, centroid } = state.audio;
    const contour = Math.sin(radius * (0.018 + mids * 0.008) - t * (0.58 + bass * 0.9));
    const ridge = Math.cos(angle * 4 + t * (0.24 + high * 0.5));
    let fx = (-dy / radius) * (0.4 + high * 0.72 + pulse * 0.3);
    let fy = (dx / radius) * (0.4 + high * 0.72 + pulse * 0.3);

    fx += (dx / radius) * contour * (0.9 + mids * 1.4);
    fy += (dy / radius) * ridge * (0.58 + bass * 1.1);
    fx += (centroid - 0.5) * 0.95;

    const reactor = getReactorInfluence(x, y, 0.44, 0.36);
    fx += reactor.x;
    fy += reactor.y;

    return { x: fx, y: fy };
  }

  return [
    {
      id: "flow",
      name: "Flow",
      description: "Long liquid wakes and bass-heavy current shifts.",
      density: 1,
      spawnBias: 0.72,
      ageMin: 120,
      ageMax: 320,
      widthMin: 0.6,
      widthMax: 2.6,
      dragBase: 0.9,
      dragByEnergy: 0.08,
      forceBase: 0.022,
      forceByEnergy: 0.026,
      forceByHigh: 0.01,
      trailAlpha(elapsed) {
        return clamp(0.09 - state.audio.energy * 0.045 + elapsed * 0.16 + getContrastState().silence * 0.08, 0.03, 0.16);
      },
      sampleField: sampleFlowField,
      drawBackdrop: drawSpectrumVeil,
      drawParticle: drawFlowParticle,
      drawOverlay: drawFlowOverlay,
    },
    {
      id: "kaleido",
      name: "Kaleido",
      description: "Mirrored petals, spoke bursts, and treble folds.",
      density: 0.34,
      spawnBias: 0.78,
      ageMin: 110,
      ageMax: 240,
      widthMin: 0.55,
      widthMax: 1.55,
      dragBase: 0.9,
      dragByEnergy: 0.07,
      forceBase: 0.024,
      forceByEnergy: 0.018,
      forceByHigh: 0.02,
      trailAlpha(elapsed) {
        return clamp(0.14 - state.audio.energy * 0.06 + elapsed * 0.18 + getContrastState().silence * 0.08, 0.04, 0.19);
      },
      sampleField: sampleKaleidoField,
      drawBackdrop: drawRadialVeil,
      drawParticle: drawKaleidoParticle,
      drawOverlay: drawKaleidoOverlay,
    },
    {
      id: "grid",
      name: "Pulse Grid",
      description: "Quantized scanlines and clipped digital crossfire.",
      density: 0.52,
      spawnBias: 0.58,
      ageMin: 110,
      ageMax: 260,
      widthMin: 0.7,
      widthMax: 1.8,
      dragBase: 0.92,
      dragByEnergy: 0.06,
      forceBase: 0.02,
      forceByEnergy: 0.018,
      forceByHigh: 0.006,
      trailAlpha(elapsed) {
        return clamp(0.16 - state.audio.energy * 0.07 + elapsed * 0.18 + getContrastState().silence * 0.08, 0.045, 0.2);
      },
      sampleField: samplePulseGridField,
      drawBackdrop: drawPulseGrid,
      drawParticle: drawGridParticle,
      drawOverlay: drawGridOverlay,
    },
    {
      id: "bloom",
      name: "Bloom",
      description: "Soft floral fog with swelling low-end petals.",
      density: 0.4,
      spawnBias: 0.88,
      ageMin: 90,
      ageMax: 170,
      widthMin: 0.9,
      widthMax: 2.25,
      dragBase: 0.9,
      dragByEnergy: 0.055,
      forceBase: 0.016,
      forceByEnergy: 0.011,
      forceByHigh: 0.004,
      createParticle() {
        return {
          petalBias: Math.random(),
          bloomLift: Math.random(),
        };
      },
      trailAlpha(elapsed) {
        return clamp(0.14 - state.audio.energy * 0.045 + elapsed * 0.14 + getContrastState().silence * 0.06, 0.04, 0.17);
      },
      sampleField: sampleBloomField,
      drawBackdrop: drawMistVeil,
      drawParticle: drawBloomParticle,
      drawOverlay: drawBloomOverlay,
    },
    {
      id: "constellation",
      name: "Constellation",
      description: "Sparse orbital nodes and brittle signal links.",
      density: 0.42,
      spawnBias: 0.64,
      ageMin: 150,
      ageMax: 340,
      widthMin: 0.7,
      widthMax: 1.5,
      dragBase: 0.94,
      dragByEnergy: 0.05,
      forceBase: 0.014,
      forceByEnergy: 0.01,
      forceByHigh: 0.006,
      trailAlpha(elapsed) {
        return clamp(0.2 - state.audio.energy * 0.06 + elapsed * 0.14 + getContrastState().silence * 0.08, 0.05, 0.24);
      },
      sampleField: sampleConstellationField,
      drawBackdrop: drawStarfield,
      drawParticle: drawConstellationParticle,
      drawOverlay: drawConstellationOverlay,
    },
    {
      id: "faultline",
      name: "Faultline",
      description: "Broken seams, slab fractures, and violent peak cuts.",
      density: 0.33,
      spawnBias: 0.72,
      ageMin: 90,
      ageMax: 220,
      widthMin: 0.65,
      widthMax: 1.9,
      dragBase: 0.9,
      dragByEnergy: 0.06,
      forceBase: 0.021,
      forceByEnergy: 0.02,
      forceByHigh: 0.022,
      trailAlpha(elapsed) {
        return clamp(0.13 - state.audio.energy * 0.05 + elapsed * 0.18 + getContrastState().silence * 0.09, 0.05, 0.19);
      },
      sampleField: sampleFaultlineField,
      drawBackdrop: drawFaultBands,
      drawParticle: drawFaultParticle,
      drawOverlay: drawFaultOverlay,
    },
    {
      id: "tideglass",
      name: "Tideglass",
      description: "Broad surf ribbons and translucent panel refractions.",
      density: 0.38,
      spawnBias: 0.8,
      ageMin: 120,
      ageMax: 260,
      widthMin: 0.75,
      widthMax: 1.9,
      dragBase: 0.92,
      dragByEnergy: 0.05,
      forceBase: 0.018,
      forceByEnergy: 0.014,
      forceByHigh: 0.008,
      trailAlpha(elapsed) {
        return clamp(0.11 - state.audio.energy * 0.04 + elapsed * 0.15 + getContrastState().silence * 0.07, 0.04, 0.16);
      },
      sampleField: sampleTideglassField,
      drawBackdrop: drawTideglassBackdrop,
      drawParticle: drawTideglassParticle,
      drawOverlay: drawTideglassOverlay,
    },
    {
      id: "monolith",
      name: "Monolith",
      description: "Brutalist columns, lifts, and block flashes.",
      density: 0.3,
      spawnBias: 0.56,
      ageMin: 130,
      ageMax: 260,
      widthMin: 0.9,
      widthMax: 2.1,
      dragBase: 0.93,
      dragByEnergy: 0.05,
      forceBase: 0.017,
      forceByEnergy: 0.012,
      forceByHigh: 0.01,
      trailAlpha(elapsed) {
        return clamp(0.14 - state.audio.energy * 0.04 + elapsed * 0.14 + getContrastState().silence * 0.1, 0.05, 0.19);
      },
      sampleField: sampleMonolithField,
      drawBackdrop: drawMonolithBackdrop,
      drawParticle: drawMonolithParticle,
      drawOverlay: drawMonolithOverlay,
    },
    {
      id: "topograph",
      name: "Topograph",
      description: "Survey contours, rings, and shifting elevation markers.",
      density: 0.32,
      spawnBias: 0.62,
      ageMin: 140,
      ageMax: 300,
      widthMin: 0.65,
      widthMax: 1.6,
      dragBase: 0.94,
      dragByEnergy: 0.045,
      forceBase: 0.015,
      forceByEnergy: 0.012,
      forceByHigh: 0.009,
      trailAlpha(elapsed) {
        return clamp(0.16 - state.audio.energy * 0.05 + elapsed * 0.13 + getContrastState().silence * 0.09, 0.05, 0.21);
      },
      sampleField: sampleTopographField,
      drawBackdrop: drawTopographBackdrop,
      drawParticle: drawTopographParticle,
      drawOverlay: drawTopographOverlay,
    },
  ];
}
