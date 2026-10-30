"""Original score for 마왕이 퇴근한 뒤. Python standard library only.
Renders deterministic, seamless 16-bar loops; no samples or external music.
"""
import math, random, wave, array
from pathlib import Path
SR = 22050
OUT = Path(__file__).resolve().parents[1] / 'assets/audio'
TAU = math.tau

def compose(name, bpm, intensity):
    beat = 60 / bpm
    length = 64 * beat
    size = round(length * SR)
    mix = array.array('f', [0]) * size
    rng = random.Random(713)
    def note(start, midi, beats, amp, voice='bell'):
        dur = beats * beat
        tail = .22 if voice == 'bell' else .07
        count = int((dur + tail) * SR)
        freq = 440 * 2 ** ((midi - 69) / 12)
        offset = round(start * beat * SR)
        for i in range(count):
            t = i / SR
            release = max(0, 1 - max(0, t-dur) / tail)
            attack = min(1, t / .009)
            phase = TAU * freq * t
            if voice == 'bell':
                v = (math.sin(phase) + .25*math.sin(phase*2) + .1*math.sin(phase*3)) * math.exp(-t*3.4)
            elif voice == 'bass':
                v = (math.sin(phase) + .22*math.sin(phase*2)) * math.exp(-t*1.7)
            elif voice == 'pad':
                v = (math.sin(phase)+.2*math.sin(phase*2)) * min(1,t/.12) * .55
            else:
                v = (math.sin(phase)+.26*math.sin(phase*3)+.1*math.sin(phase*5)) * math.exp(-t*2.8)
            mix[(offset+i) % size] += v * attack * release * amp
    def drum(start, kind, amp):
        dur = .24 if kind == 'kick' else .12
        off = round(start*beat*SR)
        for i in range(int(dur*SR)):
            t = i/SR
            if kind == 'kick':
                v = math.sin(TAU*(48*t+6*(1-math.exp(-t*35)))) * math.exp(-t*23)
            else:
                v = rng.uniform(-1,1) * math.exp(-t*(65 if kind=='hat' else 30))
            mix[(off+i)%size] += v * amp * min(1,t/.002)
    # A minor → F major → C major → E minor, with a dominant turnaround.
    chords = [(45,57,60,64),(41,57,60,65),(48,55,60,64),(40,55,59,64)]
    motifs = [[76,0,79,81,0,79,76,72], [77,0,76,72,0,69,72,76],
              [76,0,79,84,0,83,79,76], [74,0,71,76,0,75,71,68]]
    for bar in range(16):
        root, *chord = chords[bar%4]
        start = bar*4
        for p in chord:
            note(start, p, 3.7, .045, 'pad')
        for b in range(4):
            note(start+b, root+(12 if b%2 else 0), .65, .17, 'bass')
            if intensity or b in (0,2): drum(start+b,'kick',.19 if intensity else .10)
            if intensity and b in (1,3): drum(start+b,'snare',.09)
        for step in range(8):
            note(start+step*.5, chord[[0,1,2,1,0,2,1,2][step]]+12, .32, .07, 'bell')
            if intensity: drum(start+step*.5,'hat',.035)
        motif = motifs[bar%4]
        for step,p in enumerate(motif):
            if p:
                # The second phrase answers the first an octave lower.
                pitch = p - (12 if bar in (8,9,10,11) else 0)
                note(start+step*.5, pitch, .38 if step!=7 else .75, .13, 'bell' if intensity==0 else 'lead')
        if intensity == 2:
            for step in range(8):
                note(start+step*.5, root+12+(7 if step%2 else 0), .24, .075, 'lead')
    # Circular delay preserves reverb across the loop boundary.
    dry = array.array('f', mix)
    for delay,gain in [(.187,.16),(.373,.08)]:
        shift = round(delay*SR)
        for i in range(size): mix[(i+shift)%size] += dry[i]*gain
    peak = max(abs(v) for v in mix)
    pcm = array.array('h', (round(v / max(peak,1) * 26500) for v in mix))
    OUT.mkdir(parents=True,exist_ok=True)
    with wave.open(str(OUT/(name+'.wav')),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f'{name}: {length:.2f}s / {bpm} BPM / peak {max(abs(v) for v in pcm)}')

if __name__ == '__main__':
    compose('lobby-night',88,0)
    compose('night-shift',120,1)
    compose('commander',136,2)
