"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState, useEffect, useRef } from "react";

// Define a Status enum at the top level
enum Status {
  Connected = "connected",
  Disconnected = "disconnected",
}

// Define the structure for a message object
interface Message {
  from: "You" | "Customer"; // Changed 'user' to 'You' and 'ai' to 'Customer'
  text: string;
  timestamp: number; // Added timestamp property
}

export function Conversation() {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string> | null>(null); // State to store Gemini feedback
  const transcriptRef = useRef<HTMLDivElement>(null); // Ref for the transcript container
  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message: { message: string; source: "user" | "ai" }) => {
      console.log("Message:", message);
      const newMessage: Message = {
        // Explicitly type newMessage
        from: message.source === "user" ? "You" : "Customer",
        text: message.message,
        timestamp: Date.now(), // Add timestamp directly here
      };
      // Update the transcript with the new message, using 'source'
      setTranscript((prevTranscript) => [
        // Create a new array with existing messages and add timestamp if missing
        ...(prevTranscript.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || 0, // Add default timestamp if missing
          from: msg.from, // Assign directly, as it's already the correct type
        })) as Message[]), // Cast to Message[]
        newMessage,
      ]);
    },
    onError: (error) => console.error("Error:", error),
  });

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env
          .NEXT_PUBLIC_ELEVENLABS_CONVERSATIONAL_AGENT_GO_DADDY_1 as string,
      });
      // Clear the transcript when a new conversation starts
      setTranscript([]);
      setFeedback(null); // Clear previous feedback on new conversation
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation, setTranscript, setFeedback]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    const currentTranscript = [...transcript];

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: currentTranscript }),
      });

      if (response.ok) {
        const geminiFeedback = await response.json();
        setFeedback(geminiFeedback);
        console.log("Gemini Feedback:", geminiFeedback);
      } else {
        console.error(
          "Failed to get Gemini feedback:",
          response.status,
          await response.text()
        );
        setFeedback({ error: `Failed to get feedback (${response.status})` });
      }
    } catch (error) {
      console.error("Error sending transcript to audit API:", error);
      setFeedback({ error: "Failed to send transcript for audit" });
    }
  }, [conversation, transcript, setFeedback]);

  // Save the transcript to localStorage whenever it updates
  useEffect(() => {
    if (transcript.length > 0) {
      localStorage.setItem(
        "conversationTranscript",
        JSON.stringify(transcript)
      );
    } else {
      localStorage.removeItem("conversationTranscript");
    }
  }, [transcript]);

  // Scroll to the bottom of the transcript whenever it updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const getAuditResult = async (prompt: string) => {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    });

    const data = await res.json();
    console.log(data.text);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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
              conversation.status === Status.Connected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          ></span>
        </span>
        {conversation.status === Status.Connected && (
          <p>
            The customer is {conversation.isSpeaking ? "speaking" : "listening"}
          </p>
        )}
      </div>

      {/* Scrollable Transcript Container */}
      {transcript.length > 0 && (
        <div className="mt-4 w-full max-w-md rounded border p-4 overflow-y-auto max-h-96">
          <h2 className="text-lg font-semibold mb-2">
            Conversation Transcript
          </h2>
          <div className="space-y-2" ref={transcriptRef}>
            {transcript.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  msg.from === "You"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                <span className="font-semibold">{msg.from}:</span> {msg.text}
                <span className="text-xs text-gray-500 ml-2">
                  {formatTimestamp(msg.timestamp)}
                </span>{" "}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display AI's Feedback */}
      {feedback && (
        <div className="mt-4 w-full max-w-md rounded border p-4 bg-yellow-100">
          <h2 className="text-lg font-semibold mb-2">Feedback</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(feedback, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
