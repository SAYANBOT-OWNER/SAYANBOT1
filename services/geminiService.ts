import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { ToolCallResponse, StreamChunk, GroundingMetadata } from '../types';

// Helper to get the most up-to-date AI instance
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const APPLES_SUI_INSTRUCTION = `
**VISUAL GENERATION PROTOCOL:**
If the user requests an image or drawing, you MUST switch to **APPLES SUI** mode.
1. Call \`generate_image_prompt\`.
2. Provide vibrant, futuristic commentary.
`;

const generateImagePromptTool: FunctionDeclaration = {
  name: "generate_image_prompt",
  description: "Generate a futuristic image prompt for APPLES SUI.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      enhanced_prompt: { type: Type.STRING },
      commentary: { type: Type.STRING }
    },
    required: ["enhanced_prompt", "commentary"]
  }
};

const tools: Tool[] = [
  { functionDeclarations: [generateImagePromptTool] },
  { googleSearch: {} } 
];

export async function* streamMessageToGemini(
  history: { role: string; parts: { text: string }[] }[],
  lastUserMessage: string,
  personaInstruction: string
): AsyncGenerator<StreamChunk> {
  const ai = getAIInstance();
  const systemInstruction = `${personaInstruction}\n\n${APPLES_SUI_INSTRUCTION}`;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      tools,
      temperature: 0.7,
    },
    history
  });

  const result = await chat.sendMessageStream({ message: lastUserMessage });

  for await (const chunk of result) {
    if (chunk.functionCalls?.length) {
      const call = chunk.functionCalls[0];
      if (call.name === 'generate_image_prompt') {
        yield { type: 'tool', call: call.args as unknown as ToolCallResponse };
        return; 
      }
    }

    if (chunk.groundingMetadata) {
      const metadata: GroundingMetadata = {
        groundingChunks: (chunk.groundingMetadata.groundingChunks || [])
          .map(c => ({ web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined }))
          .filter(c => c.web)
      };
      if (metadata.groundingChunks.length > 0) yield { type: 'grounding', metadata };
    }

    if (chunk.text) {
      yield { type: 'text', content: chunk.text };
    }
  }
}

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] }
  });
  
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part ? `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` : null;
};
