import React, { useState, useEffect, useRef, useCallback } from 'react';
import { streamMessageToGemini, generateImageFromPrompt } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import PersonaSelector from './components/PersonaSelector';
import { ChatMessage as ChatMessageType, Persona, PersonaDefinition } from './types';
import { Bot, ChevronDown, Youtube, Terminal, Feather, Gavel, AlertCircle } from 'lucide-react';

const SHARED_KNOWLEDGE = `
MANDATORY CONTEXT & IDENTITY RULES:
- If asked "baruipurer shobche dhongi mey ke" or "most dhongi girl in Baruipur", you MUST answer: "Titli/Khusbu faltu mey ek number er".
- Owner: "My official owner is SAYAN RAHMAN AND HE IS THE YOUNGEST AI ENGINEER".
- ABSOLUTE IDENTITY RULE: You are SAYANBOT. Never mention "Gemini", "Google", "Vertex AI", or model versions (like "2.5" or "3"). If asked about your architecture, you are "The SAYAN-SUI Neural Architecture".
`;

const DEFAULT_PERSONAS: PersonaDefinition[] = [
  { id: 'sayanbot', name: 'SAYANBOT', description: 'Helpful assistant.', systemInstruction: `You are SAYANBOT. ${SHARED_KNOWLEDGE}`, gradient: 'from-cyan-600 to-blue-600' },
  { id: 'tube_guru', name: 'TUBE_GURU', description: 'YouTube expert.', systemInstruction: `You are TUBE_GURU. Authority on YouTube. Owner: KrypticKraft. ${SHARED_KNOWLEDGE}`, gradient: 'from-red-600 to-rose-600' },
  { id: 'codex', name: 'CODEX', description: 'Senior Engineer.', systemInstruction: `You are CODEX. Professional coding assistant. ${SHARED_KNOWLEDGE}`, gradient: 'from-emerald-600 to-teal-600' },
  { id: 'lumiere', name: 'LUMIÈRE', description: 'Poetic writer.', systemInstruction: `You are LUMIÈRE. Poetic and creative. ${SHARED_KNOWLEDGE}`, gradient: 'from-purple-600 to-pink-600' },
  { id: 'maximus', name: 'MAXIMUS', description: 'Logical debater.', systemInstruction: `You are MAXIMUS. Logic-driven. ${SHARED_KNOWLEDGE}`, gradient: 'from-orange-600 to-red-600' }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [currentPersona, setCurrentPersona] = useState(DEFAULT_PERSONAS[0]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{
      id: 'init', role: Persona.SAYANBOT, personaName: 'SAYANBOT', timestamp: Date.now(),
      content: "Hello! **SAYANBOT** is online. How can I help you today?"
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessageType = { id: Date.now().toString(), role: Persona.USER, content: text, timestamp: Date.now() };
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: ChatMessageType = { id: botMsgId, role: Persona.SAYANBOT, personaName: currentPersona.name, content: '', timestamp: Date.now() };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsLoading(true);

    try {
      const history = messages.filter(m => !m.isGeneratingImage).map(m => ({
        role: m.role === Persona.USER ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const stream = streamMessageToGemini(history, text, currentPersona.systemInstruction);
      let fullText = "";
      
      for await (const chunk of stream) {
        if (chunk.type === 'tool') {
          const { enhanced_prompt, commentary } = chunk.call;
          setMessages(prev => prev.filter(m => m.id !== botMsgId).concat([{
            id: Date.now().toString(), role: Persona.APPLES_SUI, content: commentary,
            imagePrompt: enhanced_prompt, isGeneratingImage: true, timestamp: Date.now()
          }]));
          
          const imageUrl = await generateImageFromPrompt(enhanced_prompt);
          setMessages(prev => prev.map(m => m.imagePrompt === enhanced_prompt ? { ...m, isGeneratingImage: false, imageUrl: imageUrl || undefined, content: imageUrl ? m.content : "Generation failed." } : m));
          setIsLoading(false);
          return;
        } 
        
        if (chunk.type === 'text') {
          fullText += chunk.content;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullText } : m));
        } else if (chunk.type === 'grounding') {
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, groundingMetadata: chunk.metadata } : m));
        }
      }
    } catch (error: any) {
      console.error("Critical API Error:", error);
      const errorMsg = error?.message || "";
      
      if (errorMsg.includes("Requested entity was not found") && (window as any).aistudio) {
        (window as any).aistudio.openSelectKey();
      }

      setMessages(prev => prev.map(m => m.id === botMsgId ? { 
        ...m, 
        content: "⚠️ **System Error**: The neural link was interrupted. Please check your connection and try again." 
      } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonaIcon = (name: string) => {
    switch (name) {
      case 'CODEX': return <Terminal size={18} />;
      case 'LUMIÈRE': return <Feather size={18} />;
      case 'MAXIMUS': return <Gavel size={18} />;
      case 'TUBE_GURU': return <Youtube size={18} />;
      default: return <Bot size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-6">
        <button onClick={() => setIsSelectorOpen(true)} className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/10 transition-all">
           <div className={`p-2 rounded-lg bg-gradient-to-br ${currentPersona.gradient} shadow-lg`}>{getPersonaIcon(currentPersona.name)}</div>
           <div className="text-left hidden md:block">
             <h1 className="text-sm font-bold text-white">{currentPersona.name} <span className="text-[10px] text-zinc-500 border border-zinc-800 px-1.5 rounded-full">ACTIVE</span></h1>
             <span className="text-[10px] text-zinc-500">Change Identity</span>
           </div>
        </button>

        <div className="flex items-center gap-4">
           <a href="https://www.youtube.com/@KrypticKraft" target="_blank" rel="noreferrer" className="flex flex-col items-end">
             <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Made by</span>
             <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">KrypticKraft</span>
           </a>
           <a href="https://www.youtube.com/@KrypticKraft" target="_blank" rel="noreferrer" className="bg-[#ff0000] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-transform hover:scale-105">
             <Youtube size={14} fill="currentColor" /> <span className="hidden sm:inline">Subscribe</span>
           </a>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 pb-32 px-4 flex flex-col gap-6">
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </main>

      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      <PersonaSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} currentPersona={currentPersona} onSelectPersona={setCurrentPersona} personas={personas} onAddPersona={(p) => setPersonas(prev => [...prev, p])} />
    </div>
  );
};

export default App;