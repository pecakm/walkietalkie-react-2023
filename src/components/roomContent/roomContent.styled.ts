import styled from 'styled-components';

import { ButtonProps } from './roomContent.types';

export const Container = styled.div``;

export const Button = styled.button`
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 100px;
  background-color: ${({ activated }: ButtonProps) => activated ? '#cefad0' : '#dedede'};
  cursor: pointer;
  border: none;
`;
