import { useEffect, useRef } from 'react';

import { PeerAudioProps } from './peerAudio.types';

export const PeerAudio = ({ peer, muted }: PeerAudioProps) => {
  const ref = useRef<any>();

  useEffect(() => {
    peer?.on('stream', (data) => {
      if (ref.current) {
        ref.current.srcObject = data;
      }
    });
  }, [peer]);

  return (
    <audio playsInline autoPlay ref={ref} muted={muted} />
  );
};
