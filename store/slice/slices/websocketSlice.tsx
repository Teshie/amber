import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  ws: WebSocket | null;
  receivedMessages: string[];
  selectedBoardNumbers: number[];
}

const initialState: WebSocketState = {
  ws: null,
  receivedMessages: [],
  selectedBoardNumbers: [],
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setWebSocket: (state, action: PayloadAction<WebSocket>) => {
      state.ws = action.payload;
    },
    addReceivedMessage: (state, action: PayloadAction<string>) => {
      state.receivedMessages.push(action.payload);
    },
    setSelectedBoardNumbers: (state, action: PayloadAction<number[]>) => {
      state.selectedBoardNumbers = action.payload;
    },
    closeWebSocket: (state) => {
      if (state.ws) {
        state.ws.close();
      }
      state.ws = null;
    },
  },
});

export const {
  setWebSocket,
  addReceivedMessage,
  setSelectedBoardNumbers,
  closeWebSocket,
} = websocketSlice.actions;

export default websocketSlice.reducer;
