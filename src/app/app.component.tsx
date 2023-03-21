import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import useSound from 'use-sound';

import { PeerAudio } from '../components/peerAudio/peerAudio.component';
import wtSfx from '../sounds/wt.mp3';
import { TurnCredentials } from '../interfaces/turnCredentials.interface';

import { getIceConfig } from './app.utils';

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
    navigator.mediaDevices.getUserMedia({ audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      myAudio.current.srcObject = mediaStream;
      const audioTracks = mediaStream.getAudioTracks();

      if (audioTracks?.length) {
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
      setPeers((prev) => [...prev, { socketId }]);
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

      setPeers((prev) => [...prev, { socketId, peer }]);
  
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

      setPeers((prev) => [...prev.filter(({ socketId }) => socketId !== from), { socketId: from, peer }]);
  
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
    <div style={{ display: 'flex', position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
      <div>
        <audio playsInline muted ref={myAudio} autoPlay />
        {peers.map(({ socketId, peer }) => (
          <PeerAudio key={socketId} peer={peer} muted={!joined} />
        ))}
      </div>
      <div>
        {joined && (
          <div>
            Channel: <b>19</b>, Freq: <b>27,180 MHz</b><br />
            Users: {peers.length + 1}
          </div>
        )}
        {joined ? (
          <>
            <button
              style={{
                position: 'absolute',
                top: '50px',
                left: 0,
                right: 0,
                bottom: '100px',
                backgroundColor: speaking ? '#cefad0' : undefined
              }}
              onMouseDown={() => toggleAudio(true)}
              onMouseUp={() => toggleAudio(false)}
              onTouchStart={() => toggleAudio(true)}
              onTouchEnd={() => toggleAudio(false)}
              disabled={micDisabled}
            >
              {micDisabled ? 'Someone speaking, wait...' : speaking ? 'Speaking...' : 'Press and hold to speak'}
            </button>
        </>
        ) : (
          <div style={{ width: '100vw' }}>
            <button
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                borderRadius: 0,
                border: 'none',
                fontSize: '16px',
              }}
              onClick={joinChat}
            >
              <p>Channel: <b>19</b> (freq: <b>27,180 MHz</b>)</p>
              <div style={{
                height: '10px',
                width: '10px',
                backgroundColor: 'green',
                borderRadius: '50%',
              }} />
            </button>
            <div style={{ height: '3px', width: '100%', borderBottom: '3px solid black' }} />
          </div>
        )}
      </div>
    </div>
  );
}
