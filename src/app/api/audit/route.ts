import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: "AIzaSyA41RUX098yirx_tfB3ZaZmRf2-GLVozDY" });

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt } = body;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return NextResponse.json({ text: response.text });
}
