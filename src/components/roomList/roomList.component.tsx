import {
  Container,
  ListItem,
  Dot,
  Separator,
} from './roomList.styled';
import { RoomListProps } from './roomList.types';

export const RoomList = ({ joinChat }: RoomListProps) => (
  <Container>
    <ListItem onClick={joinChat}>
      <p>Channel: <b>19</b> (freq: <b>27,180 MHz</b>)</p>
      <Dot />
  </ListItem>
  <Separator />
</Container>
);
