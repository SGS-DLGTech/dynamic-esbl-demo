import React, { useState, useEffect } from 'react';
import { MdErrorOutline } from 'react-icons/md';

// Define the type for the structure of each rating category
interface RatingDetail {
  stars: number;
  explanation: string;
}

// Define the full structure of the parsed feedback content
interface ParsedFeedbackContent {
  summary: string;
  ratings: {
    [key: string]: RatingDetail;
  };
  overall_sentiment: string;
  areas_for_improvement: string[];
}

// Define the type for the prop received by the Feedback component
interface FeedbackProps {
  feedback: {
    text?: string;
    error?: string;
    message?: string;
  } | null;
}

const Feedback = ({ feedback }: FeedbackProps) => {
  const [parsedFeedback, setParsedFeedback] = useState<ParsedFeedbackContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      setParsedFeedback(null);
      setError(null);
      return;
    }

    if (feedback.error) {
      setError(feedback.error);
      setParsedFeedback(null);
      return;
    }

    if (feedback.message) {
      setError(feedback.message);
      setParsedFeedback(null);
      return;
    }

    if (feedback.text) {
      try {
        const jsonString = feedback.text
          .replace(/^\s*```json\s*\n?/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(jsonString);

        if (isParsedFeedbackContent(parsed)) {
          setParsedFeedback(parsed);
          setError(null);
        } else {
          console.error("Parsed object does not match expected format:", parsed);
          setError("AI feedback is not in the expected format. Please check console for details.");
          setParsedFeedback(null);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError("Error parsing AI feedback: " + e.message + ". Raw content: " + feedback.text);
        } else {
          setError("An unknown error occurred during AI feedback parsing.");
        }
        setParsedFeedback(null);
      }
    } else {
      setError("Received empty or unrecognized feedback format.");
      setParsedFeedback(null);
    }
  }, [feedback]);

  const isParsedFeedbackContent = (obj: any): obj is ParsedFeedbackContent => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.summary === 'string' &&
      typeof obj.ratings === 'object' &&
      obj.ratings !== null &&
      typeof obj.overall_sentiment === 'string' &&
      Array.isArray(obj.areas_for_improvement) &&
      Object.values(obj.ratings).every((rating: any) =>
        typeof rating === 'object' &&
        rating !== null &&
        typeof rating.stars === 'number' &&
        typeof rating.explanation === 'string'
      )
    );
  };

  const renderStars = (count: number) => '⭐'.repeat(Math.max(0, Math.min(5, count)));

  const formatIndicatorName = (key: string) =>
    key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <>
      {!parsedFeedback && !error ? (
        <div className="mt-4 w-full max-w-md rounded border p-4 bg-gray-100 text-gray-700">
          <p>No AI feedback to display yet.</p>
        </div>
      ) : error ? (
        <div className="mt-4 w-full max-w-md mx-auto rounded border border-red-500 bg-red-100 text-red-800 p-4 flex items-start space-x-2">
          <MdErrorOutline className="text-red-600 text-xl mt-0.5 bg-red-100" />
          <div>
            <p className="font-semibold bg-red-100">Feedback Error:</p>
            <p className="whitespace-pre-wrap text-sm bg-red-100">{error}</p>
          </div>
        </div>
      ) : parsedFeedback ? (
        <div className="mt-4 w-3/4 mx-auto rounded border p-4 bg-white">
          <h2 className="text-lg font-semibold mb-2">AI Feedback Report</h2>

          <p className="mb-3">
            <span className="font-semibold">Summary:</span> {parsedFeedback.summary}
          </p>

          <h3 className="text-md font-semibold mb-2">Ratings:</h3>
          <div className="mb-3 space-y-3">
            {Object.entries(parsedFeedback.ratings).map(([key, value]) => (
              <div key={key}>
                <p className="font-semibold mb-1">{formatIndicatorName(key)}:</p>
                <p className="ml-4">Stars: {renderStars(value.stars)}</p>
                <p className="ml-4">Explanation: {value.explanation}</p>
              </div>
            ))}
          </div>

          <p className="mb-3">
            <span className="font-semibold">Overall Sentiment:</span> {parsedFeedback.overall_sentiment}
          </p>

          {parsedFeedback.areas_for_improvement.length > 0 && (
            <>
              <h3 className="text-md font-semibold mb-2">Areas for Improvement:</h3>
              <div className="space-y-1">
                {parsedFeedback.areas_for_improvement.map((area, index) => (
                  <p key={index} className="ml-4">&bull; {area}</p>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
};

export default Feedback;
