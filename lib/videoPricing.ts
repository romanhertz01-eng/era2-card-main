export type VideoDuration = 5 | 10;
export type VideoQuality = '720p' | '1080p';

const BASE_5S: Record<VideoQuality, { noAudio: number; audio: number }> = {
  '720p':  { noAudio: 20, audio: 25 },
  '1080p': { noAudio: 25, audio: 35 },
};

export interface VideoSettings {
  duration: VideoDuration;
  quality: VideoQuality;
  audioEnabled: boolean;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  duration: 5,
  quality: '1080p',
  audioEnabled: false,
};

export function calculateVideoCost({ duration, quality, audioEnabled }: VideoSettings): number {
  const mult = duration === 10 ? 2 : 1;
  const cfg = BASE_5S[quality];
  return (audioEnabled ? cfg.audio : cfg.noAudio) * mult;
}

export const VIDEO_QUALITY_OPTIONS: Array<{
  id: VideoQuality;
  label: string;
  caption: string;
}> = [
  { id: '720p',  label: '720p',  caption: 'Быстрее и дешевле' },
  { id: '1080p', label: '1080p', caption: 'Оптимальное качество' },
];
