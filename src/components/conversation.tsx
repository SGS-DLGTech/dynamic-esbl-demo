// conversation.tsx
"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState, useEffect, useRef } from "react";
import Feedback from "./feedback";

// Define a Status enum at the top level
enum Status {
  Connected = "connected",
  Disconnected = "disconnected",
}

// Define the structure for a message object
interface Message {
  from: "You" | "Customer";
  text: string;
  timestamp: number;
}

interface FeedbackState {
  text?: string;
  error?: string;
  message?: string; // For cases like "No conversation to audit."
}

export function Conversation() {
  const [transcript, setTranscript] = useState<Message[]>([]);
  // --- THIS IS THE LINE TO UPDATE ---
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  // --- END OF UPDATE ---
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Ref to hold the latest transcript for use in callbacks that might otherwise close over stale state
  const latestTranscriptRef = useRef<Message[]>([]);

  // Update the ref whenever the transcript state changes
  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // NEW: Extracted function to send transcript to audit API
  const sendTranscriptForAudit = useCallback(async (currentTranscript: Message[]) => {
    // Your instruction for Gemini, prepended to the transcript

    const prePromptInstruction = `You are an AI Quality Analyst working in a BPO setting, specialized in auditing customer service conversations.
    Your task is to analyze the following transcript and provide a detailed audit report.

    For each success indicator listed below, assign a rating from **1 to 5 stars** (where 5 is the highest/best performance) and provide a **brief explanation** for your rating.

    **Success Indicators:**
    -   **Ask the right questions:** Did the representative ask clarifying, open-ended, or probing questions to understand the customer's situation thoroughly?
    -   **Initiate sales discovery:** Did the representative identify potential upselling or cross-selling opportunities, or explore additional customer needs that could lead to a sale?
    -   **Actively listen:** Did the representative show signs of understanding, allow the customer to speak without interruption, and respond appropriately to unspoken cues?
    -   **Identify the customer's issue:** Was the representative able to quickly and accurately pinpoint the core problem or request the customer had?
    -   **Provide acknowledgment, empathy, and reassurance:** Did the representative validate the customer's feelings, show understanding, and assure them that their issue would be handled?
    -   **Educate the customer:** Did the representative clearly explain solutions, product features, or next steps in an understandable way?

    **Format your response as a JSON object** with the following structure:
    {
      "summary": "A concise summary of the conversation.",
      "ratings": {
        "ask_right_questions": { "stars": N, "explanation": "..." },
        "initiate_sales_discovery": { "stars": N, "explanation": "..." },
        "actively_listen": { "stars": N, "explanation": "..." },
        "identify_customer_issue": { "stars": N, "explanation": "..." },
        "provide_acknowledgment_empathy_reassurance": { "stars": N, "explanation": "..." },
        "educate_customer": { "stars": N, "explanation": "..." }
      },
      "overall_sentiment": "e.g., Positive, Neutral, Negative, Escalating",
      "areas_for_improvement": ["Suggestion 1", "Suggestion 2"]
    }

    Conversation Transcript:
    `

    // Format the transcript into a single string
    const formattedTranscript = currentTranscript
      .map(
        (msg) =>
          `${msg.from} (${formatTimestamp(msg.timestamp)}): ${msg.text}`
      )
      .join("\n"); // Join messages with a newline

    // Combine the instruction with the formatted transcript
    const finalPrompt = prePromptInstruction + formattedTranscript;

    if (!finalPrompt.trim()) {
      console.warn("Prompt is empty, not sending to Gemini.");
      // Now using 'error' property consistent with FeedbackState
      setFeedback({ error: "No conversation to audit." });
      return;
    }

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (response.ok) {
        const geminiFeedback = await response.json();
        setFeedback(geminiFeedback); // This should align with { text: "..." }
        console.log("Gemini Feedback:", geminiFeedback);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to get Gemini feedback:",
          response.status,
          errorText
        );
        // Using 'error' property for API errors
        setFeedback({ error: `Failed to get feedback (${response.status}): ${errorText}` });
      }
    } catch (error) {
      console.error("Error sending transcript to audit API:", error);
      // Using 'error' property for fetch exceptions
      setFeedback({ error: "Failed to send transcript for audit" });
    }
  }, [setFeedback, formatTimestamp]); // Dependencies for this useCallback

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => {
      console.log("Disconnected");
      // Call the audit function here, using the latest transcript from the ref
      // IMPORTANT: Don't call conversation.endSession() here, as it's already disconnected.
      sendTranscriptForAudit(latestTranscriptRef.current);
    },
    onMessage: (message: { message: string; source: "user" | "ai" }) => {
      console.log("Message:", message);
      const newMessage: Message = {
        from: message.source === "user" ? "You" : "Customer",
        text: message.message,
        timestamp: Date.now(),
      };
      setTranscript((prevTranscript) => [
        ...(prevTranscript.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || 0,
          from: msg.from,
        })) as Message[]),
        newMessage,
      ]);
    },
    onError: (error) => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: process.env
          .NEXT_PUBLIC_ELEVENLABS_CONVERSATIONAL_AGENT_GO_DADDY_1 as string,
      });
      setTranscript([]);
      setFeedback(null); // Clear feedback when starting a new conversation
    } catch (error) {
      console.error("Failed to start conversation:", error);
      // Using 'error' property for start conversation failures
      setFeedback({ error: `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}` });
    }
  }, [conversation, setTranscript, setFeedback]);

  const stopConversation = useCallback(async () => {
    // Explicitly end the ElevenLabs session (if not already disconnected)
    await conversation.endSession();
    // Then call the audit function with the current transcript
    sendTranscriptForAudit(transcript);
  }, [conversation, transcript, sendTranscriptForAudit]); // Added sendTranscriptForAudit to dependencies

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

  // This function is currently unused in your provided code for sending the audit result,
  // but it's kept here as it was part of your original file.
  const getAuditResult = async (prompt: string) => {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt }),
    });

    const data = await res.json();
    console.log(data.text);
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
        <div className="mt-4 w-3/4 rounded border p-4 overflow-y-auto max-h-96">
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
              </div>
            ))}
          </div>
        </div>  
      )}


      {/* Display AI's Feedback */}
      {feedback && (
      <div className="mt-4 w-3/4">
        <Feedback feedback={feedback} />
      </div>
      )}
    </div>
  );
}