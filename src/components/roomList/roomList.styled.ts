import styled from 'styled-components';

export const Container = styled.div``;

export const ListItem = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 0;
  border: none;
  font-size: 16px;
  background-color: #efefef;
  cursor: pointer;

  :hover {
    background-color: #dedede;
  }
`;

export const Dot = styled.div`
  height: 10px;
  width: 10px;
  background-color: green;
  border-radius: 50%;
`;

export const Separator = styled.div`
  height: 3px;
  background-color: black;
`;
