import { TurnCredentials } from '../interfaces/turnCredentials.interface';

export const getIceConfig = (turnCredentials: TurnCredentials | undefined) => {
  if (!turnCredentials?.id) return undefined;

  return ({
    iceServers: [{
      urls: 'stun:relay.metered.ca:80',
    }, {
      urls: 'turn:relay.metered.ca:80',
      username: turnCredentials.id,
      credential: turnCredentials.pwd,
    }, {
      urls: 'turn:relay.metered.ca:443',
      username: turnCredentials.id,
      credential: turnCredentials.pwd,
    }, {
      urls: 'turn:relay.metered.ca:443?transport=tcp',
      username: turnCredentials.id,
      credential: turnCredentials.pwd,
    }],
  });
};
