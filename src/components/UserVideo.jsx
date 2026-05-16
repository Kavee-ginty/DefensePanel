import { useEffect, useRef, useState } from 'react';

export default function UserVideo({
  muted = false,
  videoOff = false,
  documentName = null,
  className = '',
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let rafId = null;
    let audioContext = null;
    let analyser = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled || !analyser) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setIsSpeaking(avg > 18);
          rafId = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.error('[UserVideo]', err);
        setError('Camera or microphone access denied.');
      }
    };

    start();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext) audioContext.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !videoOff;
    });
  }, [videoOff]);

  const ringClass = isSpeaking
    ? 'ring-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.45)] animate-pulse'
    : 'ring-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.25)]';

  return (
    <div
      className={[
        'relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950 ring-2 transition-shadow duration-200',
        ringClass,
        className,
      ].join(' ')}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={[
          'h-full w-full object-cover mirror',
          videoOff ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
        style={{ transform: 'scaleX(-1)' }}
      />
      {videoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-sm text-zinc-400">
          Camera off
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 px-4 text-center text-sm text-red-300">
          {error}
        </div>
      )}
      {documentName && (
        <div className="absolute left-3 top-3 max-w-[70%] truncate rounded-lg border border-white/10 bg-black/55 px-2 py-1 text-xs text-zinc-200 backdrop-blur-sm">
          {documentName}
        </div>
      )}
    </div>
  );
}

