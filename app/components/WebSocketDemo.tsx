'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const WebSocketDemo: React.FC = () => {
  
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // Get and parse telegramId and stakeAmount from search parameters
  const searchParams = useSearchParams();
  const telegramId = parseInt(searchParams.get('telegram_id') || '0', 10);
  const stakeAmount = parseInt(searchParams.get('stake_amount') || '0', 10);

  console.log(telegramId, stakeAmount, 'Parsed Data');
  
  useEffect(() => {
    const webSocket = new WebSocket('ws://3.13.133.144:8088');

    webSocket.onopen = () => {
      console.log('Connected to WebSocket');
      console.log(telegramId, stakeAmount, 'Data to Send');

        const firstRequest = {
          id: `arada${Math.floor(100000 + Math.random() * 900000)}`,
          method: 'subscribe',
          body: { telegram_id: telegramId, stake_amount: stakeAmount },
        };
        webSocket.send(JSON.stringify(firstRequest));
    };

    let hasSent = false;

    webSocket.onmessage = (event: MessageEvent) => {
      const response = JSON.parse(event.data);
      setReceivedMessages((prevMessages) => [...prevMessages, JSON.stringify(response)]);
      console.log('Received response:', response);

      if (!hasSent) {
        hasSent = true;
        setTimeout(() => {
          const secondRequest = {
            id: `arada${Math.floor(100000 + Math.random() * 900000)}`,
            method: 'set_board_number',
            body: { board_number: 88 },
          };
          webSocket.send(JSON.stringify(secondRequest));
        }, 300);
      }
    };

    webSocket.onclose = (err) => {
      console.log('WebSocket connection closed', err);
    };

    setWs(webSocket);

    return () => {
      webSocket.close();
    };
  }, [telegramId, stakeAmount]);

  const handleStartGame = () => {
    if (ws) {
      const startGameRequest = {
        id: `arada${Math.floor(100000 + Math.random() * 900000)}`,
        method: 'start_game',
        body: {},
      };
      ws.send(JSON.stringify(startGameRequest));
      console.log('Start Game request sent:', startGameRequest);
    }
  };

  return (
    <div>
      <h1>WebSocket Test</h1>
      <button onClick={handleStartGame} className="bg-blue-500 text-white px-4 py-2 rounded">
        Start Game
      </button>
      <div>
        <h2>Received Messages:</h2>
        <ul>
          {receivedMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketDemo;
