'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect, useRef } from 'react';

// Define a Status enum at the top level
enum Status {
  Connected = 'connected',
  Disconnected = 'disconnected',
}

// Define the structure for a message object
interface Message {
  from: 'You' | 'Customer'; // Changed 'user' to 'You' and 'ai' to 'Customer'
  text: string;
}

export function Conversation() {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null); // Ref for the transcript container
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: { message: string; source: 'user' | 'ai' }) => {
      console.log('Message:', message);
      // Update the transcript with the new message, using 'source'
      setTranscript((prevTranscript) => [
        ...prevTranscript,
        { from: message.source === 'user' ? 'You' : 'Customer', text: message.message }, // Changed here as well
      ]);
    },
    onError: (error) => console.error('Error:', error),
  });

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_CONVERSATIONAL_AGENT_GO_DADDY_1 as string,
      });
      // Clear the transcript when a new conversation starts
      setTranscript([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, setTranscript]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Save the transcript to localStorage whenever it updates
  useEffect(() => {
    if (transcript.length > 0) {
      localStorage.setItem('conversationTranscript', JSON.stringify(transcript));
    } else {
      localStorage.removeItem('conversationTranscript');
    }
  }, [transcript]);

  // Scroll to the bottom of the transcript whenever it updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === Status.Connected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== Status.Connected}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button>
      </div>

      <div className="flex flex-col items-center">
        <span className="inline-flex items-center">
          Status: {toTitleCase(conversation.status)}
          <span
            className={`w-3 h-3 rounded-full ml-2 ${
              conversation.status === Status.Connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
        </span>
        {conversation.status === Status.Connected && (
          <p>The customer is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
        )}
      </div>

      {/* Scrollable Transcript Container */}
      {transcript.length > 0 && (
        <div className="mt-4 w-full max-w-md rounded border p-4 overflow-y-auto max-h-96">
          <h2 className="text-lg font-semibold mb-2">Conversation Transcript</h2>
          <div className="space-y-2" ref={transcriptRef}>
            {transcript.map((msg, index) => (
              <div key={index} className={`p-2 rounded ${msg.from === 'You' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                <span className="font-semibold">{msg.from}:</span> {msg.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}