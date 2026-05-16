import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
} from 'livekit-client';
import { startCall } from '../lib/sessionApi.js';

/**
 * Headless Beyond Presence panel: LiveKit-only (no bey.chat iframe).
 * Publishes microphone only; renders remote avatar video + audio.
 */
const BeyAgentCall = forwardRef(function BeyAgentCall(
  {
    agentId,
    label = null,
    started = false,
    muted = false,
    fillHeight = false,
    className = '',
  },
  ref,
) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const roomRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      /**
       * Send a text message to the avatar over LiveKit (data channel / chat).
       * Tries `sendText` with topic `lk.chat`, then legacy `sendChatMessage`.
       * @param {string} text
       */
      async sendMessage(text) {
        const trimmed = String(text ?? '').trim();
        if (!trimmed) {
          throw new Error('Message is empty');
        }
        const room = roomRef.current;
        if (!room || room.state !== ConnectionState.Connected) {
          throw new Error('Not connected to panelist yet');
        }
        const lp = room.localParticipant;
        try {
          await lp.sendText(trimmed, { topic: 'lk.chat' });
        } catch (err1) {
          console.warn(
            '[BeyAgentCall] sendText failed, trying sendChatMessage',
            err1,
          );
          await lp.sendChatMessage(trimmed);
        }
      },
    }),
    [],
  );

  const borderAccent =
    'ring-2 ring-cyan-400/70 shadow-[0_0_22px_rgba(34,211,238,0.35)]';

  const attachRemoteTrack = (track) => {
    if (track.kind === Track.Kind.Video && videoRef.current) {
      track.attach(videoRef.current);
      setHasRemoteVideo(true);
    }
    if (track.kind === Track.Kind.Audio && audioRef.current) {
      track.attach(audioRef.current);
    }
  };

  const detachRemoteTrack = (track) => {
    try {
      track.detach();
    } catch {
      /* noop */
    }
    if (track.kind === Track.Kind.Video) {
      setHasRemoteVideo(false);
    }
  };

  const wireParticipant = (participant) => {
    if (participant.isLocal) return;
    participant.trackPublications.forEach((publication) => {
      if (publication.track) {
        attachRemoteTrack(publication.track);
      }
    });
  };

  useEffect(() => {
    if (!started || !agentId?.trim()) {
      const existing = roomRef.current;
      if (existing) {
        existing.removeAllListeners();
        existing.disconnect();
        roomRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
      }
      setConnecting(false);
      setError(null);
      setHasRemoteVideo(false);
      return;
    }

    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const onTrackSubscribed = (track, _publication, participant) => {
      if (participant.isLocal) return;
      attachRemoteTrack(track);
    };

    const onTrackUnsubscribed = (track) => {
      detachRemoteTrack(track);
    };

    const onParticipantConnected = (participant) => {
      wireParticipant(participant);
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

    const run = async () => {
      setConnecting(true);
      setError(null);
      setHasRemoteVideo(false);
      try {
        const { livekit_url, livekit_token } = await startCall(agentId.trim(), {
          source: 'defense-panel-arena',
        });
        if (cancelled) return;

        await room.connect(livekit_url, livekit_token);
        if (cancelled) {
          room.disconnect();
          return;
        }

        room.remoteParticipants.forEach((p) => wireParticipant(p));

        const mic = await createLocalAudioTrack();
        if (cancelled) {
          mic.stop();
          room.disconnect();
          return;
        }
        localAudioTrackRef.current = mic;
        await room.localParticipant.publishTrack(mic);
        await room.localParticipant.setMicrophoneEnabled(!muted);
      } catch (err) {
        console.error('[BeyAgentCall]', err);
        if (!cancelled) {
          setError(err?.message || 'Could not connect');
        }
        if (!cancelled) {
          room.disconnect();
        }
      } finally {
        if (!cancelled) {
          setConnecting(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      room.disconnect();
      if (roomRef.current === room) {
        roomRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
      }
    };
  }, [started, agentId]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    void room.localParticipant.setMicrophoneEnabled(!muted).catch(() => {});
  }, [muted, started, agentId]);

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-xl bg-zinc-900/80 transition-shadow duration-200',
        fillHeight ? 'flex min-h-0 flex-1 flex-col' : '',
        borderAccent,
        className,
      ].join(' ')}
    >
      <div
        className={[
          'relative w-full',
          fillHeight ? 'min-h-0 flex-1' : 'aspect-video',
        ].join(' ')}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <audio ref={audioRef} autoPlay className="hidden" />

        {(connecting || !hasRemoteVideo) && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/80 px-4 text-center text-sm text-zinc-300">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
            {connecting ? 'Connecting to panelist…' : 'Waiting for video…'}
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 px-4 text-center text-sm text-red-300">
            {error}
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
});

BeyAgentCall.displayName = 'BeyAgentCall';

export default BeyAgentCall;
