import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

export default function AvatarView({
  livekitUrl = '',
  livekitToken = '',
  connect = true,
  isBargeIn = false,
  bargeInKey = 0,
  label = null,
  className = '',
  onConnected,
  onDisconnected,
}) {
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const [status, setStatus] = useState('idle');
  const [flare, setFlare] = useState(false);

  onConnectedRef.current = onConnected;
  onDisconnectedRef.current = onDisconnected;

  useEffect(() => {
    if (bargeInKey === 0) return;
    setFlare(true);
    const t = setTimeout(() => setFlare(false), 520);
    return () => clearTimeout(t);
  }, [bargeInKey]);

  useEffect(() => {
    const videoEl = videoRef.current;
    const canConnect =
      connect && Boolean(livekitUrl) && Boolean(livekitToken) && videoEl;

    if (!canConnect) {
      setStatus('idle');
      return;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const attachIfVideo = (track) => {
      if (!videoEl || track.kind !== Track.Kind.Video) return;
      track.attach(videoEl);
    };

    const detachRemoteToElement = () => {
      if (!videoEl) return;
      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) publication.track.detach(videoEl);
        });
      });
    };

    const onTrackSubscribed = (track) => {
      attachIfVideo(track);
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);

    let cancelled = false;

    (async () => {
      try {
        setStatus('connecting');
        await room.connect(livekitUrl, livekitToken);
        if (cancelled) return;
        setStatus('connected');
        onConnectedRef.current?.();

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) attachIfVideo(publication.track);
          });
        });
      } catch (err) {
        if (!cancelled) {
          console.error('[AvatarView] LiveKit connect failed', err);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      detachRemoteToElement();
      room.disconnect();
      if (roomRef.current === room) {
        roomRef.current = null;
      }
      onDisconnectedRef.current?.();
      setStatus('idle');
    };
  }, [connect, livekitUrl, livekitToken]);

  const borderAccent =
    isBargeIn || flare
      ? 'ring-2 ring-red-500 shadow-[0_0_28px_rgba(239,68,68,0.5)]'
      : 'ring-2 ring-cyan-400/70 shadow-[0_0_22px_rgba(34,211,238,0.35)]';

  const showPlaceholder = !connect || !livekitUrl || !livekitToken;

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-xl bg-zinc-900/80 transition-shadow duration-200',
        borderAccent,
        className,
      ].join(' ')}
    >
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          autoPlay
          muted={false}
        />

        {showPlaceholder && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-950/90 px-4 text-center">
            <p className="text-sm font-medium text-zinc-300">Awaiting stream</p>
            <p className="text-xs text-zinc-500">
              Connect LiveKit credentials from your session start API.
            </p>
          </div>
        )}

        {!showPlaceholder && status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-sm text-zinc-400">
            Connecting…
          </div>
        )}

        {!showPlaceholder && status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/85 px-4 text-center text-sm text-red-300">
            Could not connect to LiveKit. Check URL and token.
          </div>
        )}

        {label && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-medium text-zinc-100 backdrop-blur-sm">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
