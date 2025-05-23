"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import Feedback from "./feedback";
import { LoadingSpinner } from "./loadingSpinner";
import scenarios from "@/lib/scenariodb";

enum Status {
  Connected = "connected",
  Disconnected = "disconnected",
}

interface Message {
  from: "You" | "Customer";
  text: string;
  timestamp: number;
}

interface FeedbackState {
  text?: string;
  error?: string;
  message?: string;
}

export function Conversation() {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const latestTranscriptRef = useRef<Message[]>([]);

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  const toTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const selectedScenarioObj = useMemo(() => {
    return selectedScenario
      ? Object.values(scenarios)
          .flatMap(Object.values)
          .find(
            (scenario) =>
              "Scenario ID" in scenario &&
              scenario["Scenario ID"] === selectedScenario
          )
      : null;
  }, [selectedScenario]);

  const sendTranscriptForAudit = useCallback(
    async (currentTranscript: Message[]) => {
      setIsLoadingFeedback(true);
      setFeedback(null);

      const prePromptInstruction =
        selectedScenarioObj?.["AI Rating Prompt"] || 'Explain that you did not get a full rating instructions. Then, provide general feedback based on the transcript: ';

      const formattedTranscript = currentTranscript
        .map((msg) => `${msg.from} (${formatTimestamp(msg.timestamp)}): ${msg.text}`)
        .join("\n");

      const finalPrompt = prePromptInstruction + formattedTranscript;

      if (!finalPrompt.trim()) {
        setFeedback({ error: "No conversation to audit." });
        setIsLoadingFeedback(false);
        return;
      }

      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: finalPrompt }),
        });

        if (response.ok) {
          const geminiFeedback = await response.json();
          setFeedback(geminiFeedback);
        } else {
          const errorText = await response.text();
          setFeedback({ error: `Failed to get feedback (${response.status}): ${errorText}` });
        }
      } catch (error) {
        setFeedback({ error: "Failed to send transcript for audit" });
      } finally {
        setIsLoadingFeedback(false);
      }
    },
    [selectedScenarioObj]
  );

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => {
      console.log("Disconnected");
      sendTranscriptForAudit(latestTranscriptRef.current);
    },
    onMessage: (message: { message: string; source: "user" | "ai" }) => {
      const newMessage: Message = {
        from: message.source === "user" ? "You" : "Customer",
        text: message.message,
        timestamp: Date.now(),
      };
      setTranscript((prev) => [...prev, newMessage]);
    },
    onError: (error) => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      if (!selectedScenario) {
        setFeedback({ error: "Please select a scenario before starting the conversation." });
        return;
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: selectedScenario,
      });
      setTranscript([]);
      setFeedback(null);
      setIsLoadingFeedback(false);
    } catch (error) {
      setFeedback({
        error: `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}`,
      });
      setIsLoadingFeedback(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    sendTranscriptForAudit(transcript);
  }, [conversation, transcript, sendTranscriptForAudit]);

  useEffect(() => {
    if (transcript.length > 0) {
      localStorage.setItem("conversationTranscript", JSON.stringify(transcript));
    } else {
      localStorage.removeItem("conversationTranscript");
    }
  }, [transcript]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleScenarioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenario(event.target.value);
  };

  const selectedNarrative = selectedScenarioObj?.["Scenario Narrative"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-2 items-center">
        <label htmlFor="scenario-select" className="font-semibold">
          Select Scenario:
        </label>
        <select
          id="scenario-select"
          className="px-4 py-2 border rounded"
          value={selectedScenario || ""}
          onChange={handleScenarioChange}
        >
          <option value="" disabled>
            -- Choose a scenario --
          </option>
          {Object.keys(scenarios).flatMap((company: string) =>
            Object.keys(scenarios[company]).map((scenarioKey) => (
              <option key={`${company}-${scenarioKey}`} value={scenarios[company][scenarioKey]["Scenario ID"]}>
                {scenarios[company][scenarioKey].Title}
              </option>
            ))
          )}
        </select>

        <div className="mt-2 text-center">
          <h2 className="font-semibold">Scenario Narrative</h2>
          <p className="pt-2 w-1/2 min-w-lg mx-auto text-center">
            {selectedScenario ? (
              selectedNarrative || "Scenario narrative not found."
            ) : (
              "Please select a scenario to view the narrative."
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
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
              conversation.status === Status.Connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
        </span>
        {conversation.status === Status.Connected && (
          <p>The customer is {conversation.isSpeaking ? "speaking" : "listening"}</p>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="mt-4 w-3/4 rounded border p-4 overflow-y-auto max-h-96">
          <h2 className="text-lg font-semibold mb-2">Conversation Transcript</h2>
          <div className="space-y-2" ref={transcriptRef}>
            {transcript.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  msg.from === "You" ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString() + " "}<span className="font-semibold bg-transparent">{msg.from}:</span> {msg.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoadingFeedback && (
        <div className="mt-4 w-3/4">
          <LoadingSpinner message="Please wait while I review your response..." size="large" />
        </div>
      )}

      {feedback && !isLoadingFeedback && (
        <div className="mt-4 w-3/4">
          <Feedback feedback={feedback} />
        </div>
      )}
    </div>
  );
}
