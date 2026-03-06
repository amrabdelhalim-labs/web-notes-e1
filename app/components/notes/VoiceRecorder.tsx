'use client';

/**
 * VoiceRecorder — audio recording component using the MediaRecorder API.
 *
 * Features:
 * - Start / Pause / Resume / Stop recording controls
 * - Accurate live timer (paused segments are not counted)
 * - Playback preview (play / pause) after recording
 * - Re-record from scratch
 * - Shows existing audio when editing a voice note
 * - Returns base64 audio data + net recording duration via `onRecorded`
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { formatDuration, blobToBase64, createAudioUrl } from '@/app/utils/audio';

interface VoiceRecorderProps {
  /** Called with base64 audio + net duration when recording stops */
  onRecorded: (base64: string, duration: number) => void;
  /** Initial base64 audio data (when editing an existing voice note) */
  initialAudio?: string;
  /** Initial duration in seconds */
  initialDuration?: number;
}

/**
 * Internal recording phase states.
 *   idle      — not recording, no audio yet (or after reset)
 *   recording — MediaRecorder is active
 *   paused    — MediaRecorder.pause() called; timer frozen
 *   done      — recording stopped; audioUrl ready for playback
 */
type Phase = 'idle' | 'recording' | 'paused' | 'done';

export default function VoiceRecorder({
  onRecorded,
  initialAudio,
  initialDuration,
}: VoiceRecorderProps) {
  // Phase
  const [phase, setPhase] = useState<Phase>(() => (initialAudio ? 'done' : 'idle'));

  // Audio URL ownership tracking.
  // initialBlobUrlRef: URL created from the `initialAudio` prop (not owned by
  //   this component — revoked on unmount, never on reset).
  // ownedUrlRef: URL created from a new recording (owned, revoked on reset/unmount).
  //
  // NOTE: We pre-compute the initial URL here so we can pass it directly to
  // useState without touching any ref inside the initializer (which would be
  // a render-phase side-effect). The ref is populated separately below.
  const _precomputedUrl = initialAudio ? createAudioUrl(initialAudio) : null;
  const initialBlobUrlRef = useRef<string | null>(_precomputedUrl);
  const ownedUrlRef = useRef<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(_precomputedUrl);

  // Timer: `accumulatedRef` = seconds from all completed segments.
  //        `segmentStartRef` = Date.now() when current segment started.
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(initialDuration ?? 0);

  // MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Error
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount.
  // `initialBlobUrlRef.current` is captured before the cleanup function so the
  // linter can confirm its value is stable at cleanup time.
  useEffect(() => {
    const initialUrl = initialBlobUrlRef.current;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
      if (initialUrl) URL.revokeObjectURL(initialUrl);
    };
  }, []);

  // Timer helpers
  const startTimer = useCallback(() => {
    segmentStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const segSec = (Date.now() - segmentStartRef.current) / 1000;
      setElapsed(accumulatedRef.current + segSec);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Freeze: accumulate current segment and stop interval.
  const freezeTimer = useCallback(() => {
    stopTimer();
    accumulatedRef.current += (Date.now() - segmentStartRef.current) / 1000;
    setElapsed(accumulatedRef.current);
  }, [stopTimer]);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      accumulatedRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        const netDuration = accumulatedRef.current;

        if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
        const url = URL.createObjectURL(blob);
        ownedUrlRef.current = url;

        setAudioUrl(url);
        setElapsed(netDuration);
        setPhase('done');
        onRecorded(base64, netDuration);
      };

      mediaRecorder.start(250);
      setPhase('recording');
      startTimer();
    } catch {
      setError('لا يمكن الوصول إلى الميكروفون. تأكد من منح الإذن.');
    }
  }, [onRecorded, startTimer]);

  // Pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    freezeTimer();
    setPhase('paused');
  }, [freezeTimer]);

  // Resume
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setPhase('recording');
    startTimer();
  }, [startTimer]);

  // Stop
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      freezeTimer(); // accumulate last segment
    } else {
      stopTimer();
    }
    mediaRecorderRef.current?.stop();
  }, [freezeTimer, stopTimer]);

  // Reset / re-record
  const resetRecording = useCallback(() => {
    stopTimer();
    if (ownedUrlRef.current) {
      URL.revokeObjectURL(ownedUrlRef.current);
      ownedUrlRef.current = null;
    }
    accumulatedRef.current = 0;
    setAudioUrl(null);
    setElapsed(0);
    setPhase('idle');
  }, [stopTimer]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} alignItems="center">
        {/* Timer */}
        <Typography
          variant="h4"
          fontFamily="monospace"
          color={phase === 'recording' ? 'error.main' : 'text.secondary'}
          sx={{ transition: 'color 0.3s' }}
        >
          {formatDuration(elapsed)}
        </Typography>

        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" justifyContent="center">

          {/* Idle */}
          {phase === 'idle' && (
            <Button variant="contained" color="error" startIcon={<MicIcon />} onClick={startRecording} size="large">
              بدء التسجيل
            </Button>
          )}

          {/* Recording → Pause + Stop */}
          {phase === 'recording' && (
            <>
              <Button variant="outlined" color="warning" startIcon={<PauseIcon />} onClick={pauseRecording}>
                إيقاف مؤقت
              </Button>
              <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={stopRecording} sx={{ animation: 'pulse 1.5s infinite' }}>
                إنهاء التسجيل
              </Button>
            </>
          )}

          {/* Paused → Resume + Stop */}
          {phase === 'paused' && (
            <>
              <Button variant="contained" color="error" startIcon={<MicIcon />} onClick={resumeRecording}>
                استئناف
              </Button>
              <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={stopRecording}>
                إنهاء التسجيل
              </Button>
            </>
          )}

          {/* Done → Re-record button */}
          {phase === 'done' && (
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetRecording}>
              تسجيل جديد
            </Button>
          )}
        </Stack>

        {/* Native audio player — shown immediately after recording stops */}
        {phase === 'done' && audioUrl && (
          <Box
            component="audio"
            controls
            src={audioUrl}
            sx={{ width: '100%', borderRadius: 1, display: 'block' }}
          />
        )}

        {/* Recording indicator */}
        {phase === 'recording' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main', animation: 'pulse 1s infinite' }} />
            <Typography variant="body2" color="error">جار التسجيل...</Typography>
          </Box>
        )}

        {/* Paused indicator */}
        {phase === 'paused' && (
          <Typography variant="body2" color="warning.main">
            ⏸ إيقاف مؤقت — اضغط استئناف للمتابعة
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
