export interface RoomContentProps {
  userCounter: number;
  toggleAudio: (toggleOn: boolean) => void;
  micDisabled: boolean;
  speaking: boolean;
}

export interface ButtonProps {
  activated: boolean;
}
