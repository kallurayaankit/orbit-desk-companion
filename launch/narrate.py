"""Generate the approved text locally with Pocket TTS and a private voice reference.
Example: python launch/narrate.py --reference /private/raya.wav --output /private/orbit-narration
Requires an authenticated, downloaded Pocket TTS voice-cloning model.
"""
from pathlib import Path
import argparse,json
import numpy as np
from scipy.io import wavfile

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--reference',type=Path,required=True)
 parser.add_argument('--output',type=Path,required=True)
 parser.add_argument('--config',type=Path)
 args=parser.parse_args()
 from pocket_tts import TTSModel
 model=TTSModel.load_model(config=str(args.config)) if args.config else TTSModel.load_model()
 voice=model.get_state_for_audio_prompt(str(args.reference.resolve()))
 paragraphs=[x.strip() for x in Path(__file__).with_name('narration.txt').read_text().split('\n\n') if x.strip()]
 args.output.mkdir(parents=True,exist_ok=True)
 chunks=[];cues=[];cursor=0
 for i,text in enumerate(paragraphs):
  samples=model.generate_audio(voice,text).detach().cpu().numpy().astype(np.float32)
  path=args.output/f'paragraph-{i+1:02}.wav';wavfile.write(path,model.sample_rate,samples)
  duration=len(samples)/model.sample_rate
  cues.append({'paragraph':i+1,'text':text,'audio':path.name,'start':cursor,'end':cursor+duration})
  chunks.append(samples);cursor+=duration
  if i<len(paragraphs)-1:
   silence=np.zeros(round(.22*model.sample_rate),dtype=np.float32);chunks.append(silence);cursor+=len(silence)/model.sample_rate
  print(f'Paragraph {i+1}: {duration:.2f}s',flush=True)
 wavfile.write(args.output/'narration.wav',model.sample_rate,np.concatenate(chunks))
 (args.output/'narration-timing.json').write_text(json.dumps({'engine':'Pocket TTS','playbackSpeed':1,'duration':cursor,'paragraphs':cues},indent=2))
 print('Generated narration. Audition pronunciation, voice match and delivery before editing.')
if __name__=='__main__':main()
