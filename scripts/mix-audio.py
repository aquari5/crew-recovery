# Places each spoken phrase on its scene and muxes the result under the film.
# Run from the repository root, in an environment where `ffmpeg-static` is installed for node:
#   python3 scripts/mix-audio.py demo silent-demo.mp4 docs/demo.mp4 [music file]
#   python3 scripts/mix-audio.py tour silent-tour.mp4 public/tour.mp4 [music file]
# The chunk times were read off the recordings in docs/voice/ with ffmpeg's silencedetect.
# The music file is not kept in this repository: its licence covers use in a video, not redistribution.
import subprocess, sys, os
film, video, out = sys.argv[1], sys.argv[2], sys.argv[3]
music = sys.argv[4] if len(sys.argv) > 4 else None
ff = subprocess.check_output(['node','-e',"console.log(require('ffmpeg-static'))"]).decode().strip()
# (chunk start, chunk end, where speech begins in the recording, where it should begin in the film)
CHUNKS = {
  'demo': [(0,3.36,0.02,0.2),(3.36,7.22,3.67,3.7),(7.22,11.51,7.53,7.2),(11.51,15.28,11.76,11.2),(15.28,20.39,15.53,14.75),(20.39,22.72,20.69,19.6),(22.72,26.97,23.03,22.2),(26.97,29.88,27.26,26.5)],
  'tour': [(0,2.47,0.02,0.3),(2.47,5.30,2.69,3.9),(5.30,8.19,5.59,7.5),(8.19,10.71,8.33,11.9),(10.71,15.24,10.93,14.9),(15.24,17.27,15.49,19.9),(17.27,19.98,17.48,22.9),(19.98,23.83,20.14,28.7),(23.83,26.26,24.11,32.3),(26.26,27.17,26.49,37.0)],
}[film]
END = {'demo': 29.6, 'tour': 38.4}[film]
parts, labels = [], []
for i,(s,e,onset,target) in enumerate(CHUNKS):
    n = e - s; delay = max(0, round((target - (onset - s)) * 1000))
    parts.append(f"[1:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={n-0.07:.3f}:d=0.07,adelay={delay}:all=1[c{i}]")
    labels.append(f"[c{i}]")
flt = ';'.join(parts) + ';' + ''.join(labels) + f"amix=inputs={len(CHUNKS)}:normalize=0:dropout_transition=0,highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur={END}[voice]"
inputs = ['-i', video, '-i', f'docs/voice/{film}.mp3']
final = '[voice]'
if music:
    # Where the track starts, chosen so its main section comes in as the app appears on screen
    # (the section begins 22.5 s into "Spirit Molecule"; the app appears at 3.5 s in the demo and at once in the tour).
    start = {'demo': 19.0, 'tour': 22.1}[film]
    inputs += ['-ss', str(start), '-i', music]
    # Music sits well under the voice, dips further while someone speaks, and fades at both ends.
    flt += (f";[2:a]atrim=0:{END},asetpts=PTS-STARTPTS,afade=t=in:d=0.5,afade=t=out:st={END-2.2}:d=2.2,volume=0.26,aformat=channel_layouts=stereo[bed]"
            f";[voice]aformat=channel_layouts=stereo,asplit[v1][v2];[bed][v2]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=450[duck]"
            f";[v1][duck]amix=inputs=2:normalize=0,alimiter=limit=0.9[mix]")
    final = '[mix]'
subprocess.check_call([ff,'-y','-loglevel','error',*inputs,'-filter_complex',flt,'-map','0:v','-map',final,'-c:v','copy','-c:a','aac','-ar','48000','-b:a','192k','-t',str(END),'-movflags','+faststart',out])
