"""Synthesized soundtrack for the hero film: music bed plus SFX timed to the shots in src/Hero.tsx.

Standard library only. Writes a 48 kHz stereo WAV:  python3 scripts/sfx.py out/hero-sound.wav
Cue times are in frames (30 fps) so they line up with the SHOTS table and the per-shot prog() calls.
"""
import math
import random
import struct
import sys
import wave

SR = 48000
FPS = 30
DUR = 18.0
N = int(SR * DUR)
TAU = 2 * math.pi

random.seed(7)
L = [0.0] * N
R = [0.0] * N
SEND = [0.0] * N  # mono reverb send


def fr(frame):
	return frame / FPS


def put(start_s, samples, gain=1.0, pan=0.0, verb=0.0):
	"""Mix a mono sample list in at start_s with constant-power pan (-1 left .. 1 right)."""
	i0 = int(start_s * SR)
	gl = gain * math.cos((pan + 1) * math.pi / 4)
	gr = gain * math.sin((pan + 1) * math.pi / 4)
	for k, s in enumerate(samples):
		i = i0 + k
		if 0 <= i < N:
			L[i] += s * gl
			R[i] += s * gr
			if verb:
				SEND[i] += s * gain * verb


def put_panned(start_s, samples, pans, gain=1.0, verb=0.0):
	"""Like put() but with a per-sample pan list (for moving sounds)."""
	i0 = int(start_s * SR)
	for k, s in enumerate(samples):
		i = i0 + k
		if 0 <= i < N:
			p = pans[k]
			L[i] += s * gain * math.cos((p + 1) * math.pi / 4)
			R[i] += s * gain * math.sin((p + 1) * math.pi / 4)
			if verb:
				SEND[i] += s * gain * verb


def noise(n):
	return [random.uniform(-1, 1) for _ in range(n)]


def bandpass_sweep(x, f0, f1, q, curve=1.0):
	"""RBJ band-pass whose centre glides from f0 to f1 (exponential), coefficients updated every 32 samples."""
	out = []
	x1 = x2 = y1 = y2 = 0.0
	n = len(x)
	b0 = b2 = a1 = a2 = 0.0
	for k in range(n):
		if k % 32 == 0:
			t = (k / n) ** curve
			f = f0 * (f1 / f0) ** t
			w = TAU * f / SR
			alpha = math.sin(w) / (2 * q)
			a0 = 1 + alpha
			b0, b2 = alpha / a0, -alpha / a0
			a1, a2 = -2 * math.cos(w) / a0, (1 - alpha) / a0
		y = b0 * x[k] + b2 * x2 - a1 * y1 - a2 * y2
		x2, x1 = x1, x[k]
		y2, y1 = y1, y
		out.append(y)
	return out


def lowpass(x, cutoff):
	a = 1 - math.exp(-TAU * cutoff / SR)
	y = 0.0
	out = []
	for s in x:
		y += a * (s - y)
		out.append(y)
	return out


def env_ar(n, attack, curve=2.0):
	"""Attack fraction then exponential-ish release, 0..1."""
	a = max(1, int(n * attack))
	return [(k / a) ** 2 if k < a else (1 - (k - a) / max(1, n - a)) ** curve for k in range(n)]


# ---------- instruments ----------

def whoosh(dur=0.5, f0=250, f1=4200, peak=0.62):
	n = int(dur * SR)
	body = bandpass_sweep(noise(n), f0, f1, 0.9, curve=0.8)
	air = bandpass_sweep(noise(n), f0 * 4, f1 * 1.6, 2.5)
	env = env_ar(n, peak, 2.6)
	return [(b * 1.0 + a * 0.35) * e for b, a, e in zip(body, air, env)]


def click(bright=1.0):
	n = int(0.018 * SR)
	f = random.uniform(1800, 2600) * bright
	return [(random.uniform(-1, 1) * 0.55 + math.sin(TAU * f * k / SR) * 0.45) * math.exp(-k / (SR * 0.0035)) for k in range(n)]


def key():
	"""Soft keyboard key: a damped low thock plus a tiny click."""
	n = int(0.05 * SR)
	f = random.uniform(140, 190)
	tone = [math.sin(TAU * f * k / SR) * math.exp(-k / (SR * 0.012)) for k in range(n)]
	nz = lowpass(noise(n), 3500)
	return [t * 0.6 + z * 0.9 * math.exp(-k / (SR * 0.004)) for k, (t, z) in enumerate(zip(tone, nz))]


def tick(freq, dur=0.35):
	n = int(dur * SR)
	return [(math.sin(TAU * freq * k / SR) + 0.25 * math.sin(TAU * freq * 2.01 * k / SR)) * math.exp(-k / (SR * 0.07)) * min(1, k / 40) for k in range(n)]


def pop(f0=900, f1=260, dur=0.12):
	n = int(dur * SR)
	ph = 0.0
	out = []
	for k in range(n):
		f = f1 + (f0 - f1) * math.exp(-k / (SR * 0.018))
		ph += TAU * f / SR
		out.append(math.sin(ph) * math.exp(-k / (SR * 0.03)) * min(1, k / 30))
	return out


def thud(f0=140, f1=48, dur=0.32):
	n = int(dur * SR)
	ph = 0.0
	nz = lowpass(noise(n), 1800)
	out = []
	for k in range(n):
		f = f1 + (f0 - f1) * math.exp(-k / (SR * 0.03))
		ph += TAU * f / SR
		out.append(math.sin(ph) * math.exp(-k / (SR * 0.09)) + nz[k] * 0.5 * math.exp(-k / (SR * 0.006)))
	return out


def chime(notes, dur=1.1, spread=0.06):
	n = int(dur * SR)
	out = [0.0] * n
	for j, f in enumerate(notes):
		d = int(j * spread * SR)
		for k in range(n - d):
			out[k + d] += (math.sin(TAU * f * k / SR) + 0.18 * math.sin(TAU * f * 3 * k / SR)) * math.exp(-k / (SR * 0.28)) * min(1, k / 60)
	return out


def glitch(dur=0.5, density=55):
	"""Scramble text: a stream of tiny square blips at random pitches."""
	n = int(dur * SR)
	out = [0.0] * n
	step = SR // density
	for start in range(0, n, step):
		f = random.choice([1200, 1600, 2000, 2400, 3200, 4000])
		ln = int(SR * random.uniform(0.006, 0.014))
		amp = random.uniform(0.35, 1.0)
		for k in range(ln):
			if start + k < n:
				out[start + k] += (1 if math.sin(TAU * f * k / SR) > 0 else -1) * amp * (1 - k / ln)
	fade = env_ar(n, 0.05, 1.2)
	return [s * e for s, e in zip(lowpass(out, 6000), fade)]


def riser(dur=1.0):
	n = int(dur * SR)
	nz = bandpass_sweep(noise(n), 300, 7000, 1.4, curve=1.6)
	ph = 0.0
	out = []
	for k in range(n):
		t = k / n
		ph += TAU * (110 + 660 * t ** 2) / SR
		g = t ** 2.2
		out.append((nz[k] * 0.9 + math.sin(ph) * 0.25) * g)
	return out


def impact(dur=2.2):
	n = int(dur * SR)
	nz = lowpass(noise(n), 900)
	ph = 0.0
	out = []
	for k in range(n):
		f = 34 + 46 * math.exp(-k / (SR * 0.08))
		ph += TAU * f / SR
		out.append(math.sin(ph) * math.exp(-k / (SR * 0.55)) * 1.2 + nz[k] * math.exp(-k / (SR * 0.05)) * 1.4)
	return out


def kick():
	return thud(160, 45, 0.28)


def hat():
	n = int(0.06 * SR)
	nz = noise(n)
	hp = [s - l for s, l in zip(nz, lowpass(nz, 7000))]
	return [s * math.exp(-k / (SR * 0.012)) for k, s in enumerate(hp)]


# ---------- music bed ----------

def note(m):
	return 440 * 2 ** ((m - 69) / 12)


def pad(start, end, midi, gain, fade_in=0.8, fade_out=0.8):
	n0, n1 = int(start * SR), int(end * SR)
	fi, fo = int(fade_in * SR), int(fade_out * SR)
	freqs = [(note(m), d) for m in midi for d in (-0.12, 0.12)]
	for i in range(n0, min(n1, N)):
		k = i - n0
		e = min(1, k / fi, (n1 - i) / fo)
		lfo = 0.85 + 0.15 * math.sin(TAU * 0.25 * i / SR)
		t = i / SR
		sl = sr = 0.0
		for j, (f, d) in enumerate(freqs):
			s = math.sin(TAU * (f * (1 + d / 100)) * t + j)
			if j % 2:
				sr += s
			else:
				sl += s
		L[i] += sl * gain * e * lfo / len(midi)
		R[i] += sr * gain * e * lfo / len(midi)


def bass(start, end, midi, gain):
	n0, n1 = int(start * SR), int(end * SR)
	f = note(midi)
	for i in range(n0, min(n1, N)):
		e = min(1, (i - n0) / (SR * 0.4), (n1 - i) / (SR * 0.3))
		s = math.sin(TAU * f * i / SR) * gain * e
		L[i] += s
		R[i] += s


# ---------- reverb (Schroeder) ----------

def reverb(x):
	out = [0.0] * N
	for delay, fb in ((1557, 0.82), (1617, 0.81), (1491, 0.83), (1422, 0.80)):
		buf = [0.0] * delay
		j = 0
		for i in range(N):
			y = buf[j]
			buf[j] = x[i] + y * fb
			j = (j + 1) % delay
			out[i] += y * 0.25
	for delay, g in ((225, 0.7), (556, 0.7)):
		buf = [0.0] * delay
		j = 0
		for i in range(N):
			b = buf[j]
			y = -out[i] * g + b
			buf[j] = out[i] + b * g
			j = (j + 1) % delay
			out[i] = y
	return out


# ---------- the score ----------

BEAT = 0.5  # 120 bpm
IMPACT = fr(450 + 22)  # logo flash

# Bed: A minor add9 under the product shots, opening up to C major 7 on the logo.
pad(0.0, IMPACT - 0.05, [57, 64, 71, 72], 0.11, fade_in=1.6, fade_out=0.25)
pad(IMPACT, DUR, [48, 55, 64, 71, 76], 0.13, fade_in=0.05, fade_out=2.2)
bass(fr(78), IMPACT - 0.4, 45, 0.10)
bass(IMPACT, DUR - 0.2, 36, 0.12)

# Pulse from the first cut to just before the riser, hats join when the results stack in.
t = fr(78)
while t < IMPACT - 1.05:
	put(t, kick(), 0.30)
	if t >= fr(258):
		put(t + BEAT / 2, hat(), 0.10, pan=0.25)
	t += BEAT

# Composer: edge sweep, typing, send.
put(fr(8), whoosh(1.0, 2000, 7000, 0.5), 0.10, pan=-0.3, verb=0.2)
for c in range(0, 44, 2):
	put(fr(28) + c / 1.45 / FPS + random.uniform(-0.006, 0.006), key(), 0.32, pan=random.uniform(-0.15, 0.15))
put(fr(64), click(1.0), 0.45, verb=0.15)
put(fr(64), pop(700, 220, 0.1), 0.35)

# Whip cuts: every shot enters from the right and leaves to the left.
for start in (78, 168, 258, 318, 390, 450):
	w = whoosh(0.55)
	pans = [0.7 - 1.4 * k / len(w) for k in range(len(w))]
	put_panned(fr(start) - 0.32, w, pans, 0.55, verb=0.25)
	put(fr(start) - 0.02, thud(110, 50, 0.22), 0.18)

# App window: user message, plan card, four work steps ticking done on a rising scale.
put(fr(78 + 4), pop(1100, 420), 0.18)
put(fr(78 + 12), pop(800, 300), 0.18)
for i, m in enumerate((76, 79, 81, 84)):
	put(fr(78 + 24 + i * 12 + 14), tick(note(m)), 0.16, pan=-0.2 + i * 0.13, verb=0.25)

# Decision card: three style tiles land, Recommended lights up, Continue is pressed.
for i in range(3):
	put(fr(168 + 6 + i * 6 + 8), pop(620, 200, 0.1), 0.25, pan=-0.4 + i * 0.4)
put(fr(168 + 30), chime([note(81), note(88)], 0.9), 0.13, pan=0.2, verb=0.35)
put(fr(168 + 66), click(0.9), 0.5)
put(fr(168 + 66), pop(500, 180, 0.09), 0.3)

# Results stack in depth.
for i in range(4):
	put(fr(258 + 4 + i * 7 + 6), thud(220 - i * 20, 70, 0.2), 0.28, pan=-0.3 + i * 0.2, verb=0.2)

# Strategy: scramble heading, bet cards, the saved toast.
put(fr(318 + 2), glitch(0.55), 0.16, pan=-0.1)
for i in range(3):
	put(fr(318 + 14 + i * 5 + 4), pop(900, 350, 0.08), 0.16, pan=-0.3 + i * 0.3)
put(fr(318 + 46), chime([note(84), note(88), note(91)], 1.2, 0.07), 0.14, pan=0.3, verb=0.4)

# Words: each bracketed word lands with a hit and decodes.
for i in range(3):
	put(fr(390 + i * 20), thud(170, 55, 0.3), 0.42, verb=0.3)
	put(fr(390 + i * 20), glitch(0.28, 70), 0.12, pan=0.15 * (i - 1))

# Logo: streaks converge on a riser, impact on the flash, a shimmer as the wordmark resolves.
put(IMPACT - 1.0, riser(1.0), 0.38, verb=0.3)
put(IMPACT, impact(), 0.75, verb=0.5)
put(IMPACT + 0.05, chime([note(72), note(79), note(84), note(88)], 2.4, 0.05), 0.12, verb=0.6)
put(fr(450 + 52), tick(note(96), 0.6), 0.05, pan=0.3, verb=0.5)

# ---------- mix down ----------

wet = reverb(lowpass(SEND, 6500))
for i in range(N):
	L[i] += wet[i] * 0.55
	R[i] += wet[(i - 240) if i >= 240 else i] * 0.55

# Fade the very end to silence so the loop is seamless, then normalise with a soft clip.
tail = int(0.6 * SR)
for i in range(N - tail, N):
	g = (N - i) / tail
	L[i] *= g
	R[i] *= g
peak = max(max(abs(v) for v in L), max(abs(v) for v in R)) or 1.0
drive = 1.25 / peak
out = sys.argv[1] if len(sys.argv) > 1 else "out/hero-sound.wav"
with wave.open(out, "wb") as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	frames = bytearray()
	for l, r in zip(L, R):
		frames += struct.pack("<hh", int(math.tanh(l * drive) * 0.89 * 32767), int(math.tanh(r * drive) * 0.89 * 32767))
	w.writeframes(bytes(frames))
print(f"wrote {out} ({DUR:.1f}s)")
