import { Container, Button } from './roomContent.styled';
import { RoomContentProps } from './roomContent.types';

export const RoomContent = ({
  userCounter,
  toggleAudio,
  micDisabled,
  speaking,
}: RoomContentProps) => (
  <Container>
    Channel: <b>19</b>, Freq: <b>27,180 MHz</b><br />
    Users: <b>{userCounter}</b>
    <Button
      onMouseDown={() => toggleAudio(true)}
      onMouseUp={() => toggleAudio(false)}
      onTouchStart={() => toggleAudio(true)}
      onTouchEnd={() => toggleAudio(false)}
      disabled={micDisabled}
      activated={speaking}
    >
      {micDisabled
        ? 'Someone\'s speaking, wait...'
          : speaking
            ? 'Speaking...'
            : 'Press and hold to speak'
      }
    </Button>
  </Container>
);
