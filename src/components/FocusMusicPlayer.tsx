
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  generate: (ctx: AudioContext, gain: GainNode) => AudioNode[];
}

// Real audio generation using Web Audio API
function createBrownNoise(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  // Low pass for rain-like quality
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  source.connect(filter);
  filter.connect(gain);
  source.start();
  return [source, filter];
}

function createPinkNoise(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  source.start();
  return [source];
}

function createLofi(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Warm pad with chord (C-E-G)
  const freqs = [261.63, 329.63, 392.00, 523.25];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.04;
    // Slight detuning for warmth
    osc.detune.value = Math.random() * 10 - 5;
    // Low pass for muffled lo-fi feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gain);
    osc.start();
    nodes.push(osc, oscGain, filter);
  });
  // Add subtle noise texture
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.015;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilt = ctx.createBiquadFilter();
  noiseFilt.type = 'bandpass';
  noiseFilt.frequency.value = 500;
  noiseFilt.Q.value = 0.5;
  noiseSource.connect(noiseFilt);
  noiseFilt.connect(gain);
  noiseSource.start();
  nodes.push(noiseSource, noiseFilt);
  return nodes;
}

function createForest(ctx: AudioContext, gain: GainNode): AudioNode[] {
  // Wind-like sound with occasional bird chirp simulation
  const nodes: AudioNode[] = [];
  // Wind base (filtered white noise)
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 300;
  filter.Q.value = 0.3;
  // Add slow LFO to frequency for natural variation
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 100;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  source.connect(filter);
  filter.connect(gain);
  source.start();
  nodes.push(source, filter, lfo, lfoGain);
  return nodes;
}

function createOcean(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Ocean waves = modulated brown noise
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
    // Add wave envelope
    const phase = (i / ctx.sampleRate) * 0.15;
    const envelope = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
    data[i] *= envelope;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  source.connect(filter);
  filter.connect(gain);
  source.start();
  nodes.push(source, filter);
  return nodes;
}

function createWhiteNoise(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 8000;
  source.connect(filter);
  filter.connect(gain);
  source.start();
  return [source, filter];
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Rain', emoji: '🌧️', description: 'Gentle rain sounds', generate: createBrownNoise },
  { id: 'lofi', name: 'Lo-fi', emoji: '🎵', description: 'Warm lo-fi ambient', generate: createLofi },
  { id: 'forest', name: 'Forest', emoji: '🌲', description: 'Forest wind & nature', generate: createForest },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', description: 'Ocean waves', generate: createOcean },
  { id: 'pink', name: 'Pink Noise', emoji: '🩷', description: 'Smooth pink noise', generate: createPinkNoise },
  { id: 'white', name: 'White Noise', emoji: '⬜', description: 'Classic white noise', generate: createWhiteNoise },
];

interface FocusMusicPlayerProps {
  compact?: boolean;
}

const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ compact = false }) => {
  const [activeSound, setActiveSound] = useState<string | null>(() => {
    return localStorage.getItem('focus-music-active') || null;
  });
  const [volume, setVolume] = useState<number>(() => {
    return parseInt(localStorage.getItem('focus-music-volume') || '40');
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const stopAudio = useCallback(() => {
    nodesRef.current.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (error) {
        console.debug('Audio node was already stopped', error);
      }
    });
    nodesRef.current = [];
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback((soundId: string) => {
    stopAudio();

    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
    if (!sound) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    const nodes = sound.generate(ctx, gain);
    nodesRef.current = nodes;
    setIsPlaying(true);
  }, [volume, stopAudio]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
    localStorage.setItem('focus-music-volume', String(volume));
  }, [volume]);

  // Persist active sound
  useEffect(() => {
    if (activeSound) {
      localStorage.setItem('focus-music-active', activeSound);
    } else {
      localStorage.removeItem('focus-music-active');
    }
  }, [activeSound]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAudio]);

  const toggleSound = (soundId: string) => {
    if (activeSound === soundId && isPlaying) {
      stopAudio();
      setActiveSound(null);
    } else {
      setActiveSound(soundId);
      startAudio(soundId);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Music size={14} className="text-muted-foreground" />
        <div className="flex gap-1">
          {AMBIENT_SOUNDS.slice(0, 4).map(sound => (
            <button
              key={sound.id}
              onClick={() => toggleSound(sound.id)}
              className={cn(
                'text-xs px-2 py-1 rounded-full transition-all',
                activeSound === sound.id && isPlaying
                  ? 'bg-brand/20 text-brand ring-1 ring-brand/30'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {sound.emoji}
            </button>
          ))}
        </div>
        {isPlaying && (
          <Slider
            min={0}
            max={100}
            step={5}
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            className="w-16"
          />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music size={18} className="text-brand" />
          Focus Music
          {isPlaying && (
            <Badge className="ml-auto bg-brand/10 text-brand text-[10px]">
              Playing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {AMBIENT_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => toggleSound(sound.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center',
                activeSound === sound.id && isPlaying
                  ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                  : 'border-border hover:border-brand/30 bg-background'
              )}
            >
              <span className="text-xl">{sound.emoji}</span>
              <span className="text-[11px] font-medium">{sound.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => { if (isPlaying) { stopAudio(); setActiveSound(null); } else if (activeSound) { startAudio(activeSound); } }}>
            {volume === 0 ? <VolumeX size={16} className="text-muted-foreground" /> : <Volume2 size={16} />}
          </button>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{volume}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusMusicPlayer;
