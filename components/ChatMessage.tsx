import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Sparkles, Terminal, Feather, Gavel, Loader2, Youtube, ExternalLink, Search } from 'lucide-react';
import { ChatMessage as ChatMessageType, Persona } from '../types';

interface Props {
  message: ChatMessageType;
}

// Helper to get icon based on Persona Name
const getPersonaIcon = (name?: string) => {
  switch (name) {
    case 'CODEX': return <Terminal size={20} className="text-white" />;
    case 'LUMIÈRE': return <Feather size={20} className="text-white" />;
    case 'MAXIMUS': return <Gavel size={20} className="text-white" />;
    case 'TUBE_GURU': return <Youtube size={20} className="text-white" />;
    default: return <Bot size={20} className="text-white" />;
  }
};

const ChatMessage: React.FC<Props> = memo(({ message }) => {
  const isUser = message.role === Persona.USER;
  const isApplesSui = message.role === Persona.APPLES_SUI;

  // Dynamic styles based on persona
  const containerClass = isUser
    ? "flex-row-reverse"
    : "flex-row";

  const bubbleClass = isUser
    ? "bg-zinc-800 text-white border-zinc-700"
    : isApplesSui
      ? "bg-gradient-to-br from-purple-900/40 via-fuchsia-900/20 to-black border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]"
      : "bg-zinc-900/80 border-zinc-800 text-zinc-100 shadow-sm"; // Default bot style

  const textClass = isUser 
    ? "text-zinc-100" 
    : isApplesSui 
      ? "text-fuchsia-100" 
      : "text-zinc-200";

  const iconContainerClass = isUser
    ? "bg-zinc-700"
    : isApplesSui
      ? "bg-fuchsia-600 shadow-lg shadow-fuchsia-500/50"
      : message.personaName === 'TUBE_GURU'
        ? "bg-red-600 border border-red-500"
        : "bg-zinc-800 border border-zinc-700";

  return (
    <div className={`flex w-full gap-4 p-4 ${containerClass} animate-fade-in group`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconContainerClass}`}>
        {isUser ? (
          <User size={20} className="text-white" />
        ) : isApplesSui ? (
          <Sparkles size={20} className="text-white animate-pulse" />
        ) : (
          getPersonaIcon(message.personaName)
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] rounded-2xl p-5 border backdrop-blur-sm ${bubbleClass}`}>
        
        {/* Persona Header */}
        {!isUser && (
          <div className={`text-[10px] font-bold tracking-widest mb-2 uppercase flex items-center gap-2 ${isApplesSui ? "text-fuchsia-400" : "text-cyan-400"}`}>
             {isApplesSui ? (
               <>
                 <Sparkles size={12} /> APPLES SUI (CREATIVE MODE)
               </>
             ) : (
               <>
                 <span className="opacity-70">{message.personaName || "SAYANBOT"}</span>
               </>
             )}
          </div>
        )}

        {/* Text Body - Using memoized markdown for speed */}
        <div className={`prose prose-invert max-w-none text-sm leading-relaxed ${textClass} prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-headings:text-white`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Image Generation State */}
        {isApplesSui && message.isGeneratingImage && (
           <div className="mt-4 p-4 rounded-xl border border-fuchsia-500/30 bg-black/40 flex items-center gap-3">
              <Loader2 className="animate-spin text-fuchsia-500" size={24} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-fuchsia-300">Rendering Vision...</span>
                <span className="text-xs text-fuchsia-500/70 truncate max-w-[200px] md:max-w-[300px]">Prompt: {message.imagePrompt}</span>
              </div>
           </div>
        )}

        {/* Generated Image */}
        {message.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all duration-500">
             <img 
               src={message.imageUrl} 
               alt="Generated Vision" 
               className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
               loading="lazy"
             />
             <div className="bg-black/80 p-2 text-[10px] text-zinc-400 font-mono border-t border-white/10 truncate">
                PROMPT_MATRIX: {message.imagePrompt}
             </div>
          </div>
        )}

        {/* Search Results / Grounding */}
        {message.groundingMetadata && message.groundingMetadata.groundingChunks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              <Search size={12} /> Sources Found
            </div>
            <div className="grid grid-cols-1 gap-2">
              {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
                if (!chunk.web) return null;
                return (
                  <a 
                    key={idx} 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group/link"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-medium text-cyan-300 truncate pr-2 group-hover/link:underline">
                        {chunk.web.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {chunk.web.uri}
                      </span>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 group-hover/link:text-cyan-300 flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;