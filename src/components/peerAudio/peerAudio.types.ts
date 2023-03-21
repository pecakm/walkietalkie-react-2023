import Peer from 'simple-peer';

export interface PeerAudioProps {
  muted: boolean;
  peer?: Peer.Instance;
}
