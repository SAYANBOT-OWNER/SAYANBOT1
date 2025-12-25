export enum Persona {
  SAYANBOT = 'SAYANBOT',
  APPLES_SUI = 'APPLES_SUI',
  USER = 'USER',
  CUSTOM = 'CUSTOM'
}

export interface PersonaDefinition {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  gradient: string; // CSS class for visual flair
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
}

export interface ChatMessage {
  id: string;
  role: Persona;
  personaName?: string; // Display name (e.g., "CODEX")
  content: string; // The text content or commentary
  imagePrompt?: string; // If APPLES SUI, the enhanced prompt
  imageUrl?: string; // If an image was generated
  isGeneratingImage?: boolean; // Loading state for image
  timestamp: number;
  groundingMetadata?: GroundingMetadata; // Search results/sources
}

export interface ToolCallResponse {
  enhanced_prompt: string;
  commentary: string;
}

export type StreamChunk = 
  | { type: 'text'; content: string }
  | { type: 'tool'; call: ToolCallResponse }
  | { type: 'grounding'; metadata: GroundingMetadata };