import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import useSound from 'use-sound';

import { PeerAudio } from '../components/peerAudio/peerAudio.component';
import { RoomContent } from '../components/roomContent/roomContent.component';
import { RoomList } from '../components/roomList/roomList.component';
import wtSfx from '../sounds/wt.mp3';
import { TurnCredentials } from '../interfaces/turnCredentials.interface';

import { getIceConfig } from './app.utils';
import { Container } from './app.styled';

const socket = io(`${process.env.REACT_APP_SOCKET_URL}`);

export const App = () => {
  const [play] = useSound(wtSfx, { interrupt: true, volume: 0.5 });
  const [visibilityChanged, setVisibilityChanged] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [mySocketId, setMySocketId] = useState();
  const [peers, setPeers] = useState<{ socketId: string; peer?: Peer.Instance }[]>([]);
  const [turnCredentials, setTurnCredentials] = useState<TurnCredentials>();
  const [joined, setJoined] = useState(false);
  const [micDisabled, setMicDisabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const myAudio = useRef<any>();

  useEffect(() => {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        setVisibilityChanged(true);
      }
    });
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
      const mediaStream = new MediaStream();
      const audioTracks = media.getAudioTracks();
      setStream(mediaStream);
      myAudio.current.srcObject = mediaStream;

      if (audioTracks?.length) {
        mediaStream.addTrack(audioTracks[0]);
        audioTracks[0].enabled = false;
      }
    });
  }, []);

  useEffect(() => {
    if (visibilityChanged && stream) {
      setVisibilityChanged(false);

      navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
        const oldTrack = stream.getAudioTracks()[0];
        const newTrack = media.getAudioTracks()[0];
        oldTrack.enabled = false;
        stream.removeTrack(oldTrack);
        stream.addTrack(newTrack);
  
        peers.forEach(({ peer }) => {
          peer?.replaceTrack(oldTrack, newTrack, stream);
          newTrack.enabled = false;
        });
      });
    }
  }, [visibilityChanged, peers, stream]);

  useEffect(() => {
    socket.on('initInfo', ({ turnId, turnPwd, mySocketId }) => {
      setTurnCredentials({ id: turnId, pwd: turnPwd });
      setMySocketId(mySocketId);
    });

    socket.on('userJoined', (socketId) => {
      setPeers((prev) => [
        ...prev.filter((peer) => peer.socketId !== socketId),
        { socketId },
      ]);
      socket.emit('welcomeUser', { from: mySocketId, to: socketId });
    });

    socket.on('userDisconnected', (removedSocketId) => {
      const peerInstance = peers.find(({ socketId }) => socketId === removedSocketId);
      peerInstance?.peer?.destroy();
      setPeers((prev) => prev.filter((peer) => peer.socketId !== removedSocketId));
    });

    socket.on('welcomeUser', (socketId) => {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        config: turnCredentials?.id ? getIceConfig(turnCredentials) : undefined,
        stream,
      });

      setPeers((prev) => [
        ...prev.filter((peer) => peer.socketId !== socketId),
        { socketId, peer },
      ]);
  
      peer.on('signal', (signal) => {
        socket.emit('callUser', { to: socketId, from: mySocketId, signal });
      });
    });
  
    socket.on('incomingCall', ({ from, signal }) => {
      const peer = new Peer({
        trickle: false,
        config: getIceConfig(turnCredentials),
        stream,
      });

      setPeers((prev) => [
        ...prev.filter(({ socketId }) => socketId !== from),
        { socketId: from, peer },
      ]);
  
      peer.on('signal', (signal) => {
        socket.emit('answerCall', { from: mySocketId, to: from, signal });
      });
  
      peer.signal(signal);
    });

    socket.on('callAccepted', ({ from, signal }) => {
      const peerInstance = peers.find((peer) => peer.socketId === from);
      peerInstance?.peer?.signal(signal);
    });

    socket.on('disableMic', () => {
      setMicDisabled(true);
    });

    socket.on('enableMic', () => {
      setMicDisabled(false);
    });

    return () => {
      socket.off();
    }
  }, [mySocketId, peers, stream, turnCredentials]);

  useEffect(() => {
    if (joined) {
      play();
    }
  }, [micDisabled, joined, play]);

  const joinChat = () => {
    setJoined(true);
    socket.emit('joinRoom');
  };

  const toggleAudio = (toggleOn: boolean) => {
    const audioTracks = stream?.getAudioTracks();

    if (audioTracks?.length) {
      audioTracks[0].enabled = toggleOn;
      socket.emit(toggleOn ? 'startSpeaking' : 'stopSpeaking');
      setSpeaking(toggleOn);
    }
  };

  return (
    <Container>
      <audio ref={myAudio} playsInline muted autoPlay />
      {peers.map(({ socketId, peer }) => (
        <PeerAudio key={socketId} peer={peer} muted={!joined} />
      ))}
      {joined ? (
        <RoomContent
          userCounter={peers.length + 1}
          speaking={speaking}
          micDisabled={micDisabled}
          toggleAudio={toggleAudio}
        />
      ) : (
        <RoomList joinChat={joinChat} />
      )}
    </Container>
  );
}
