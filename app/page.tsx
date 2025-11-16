'use client';

import { useState } from 'react';

interface LLMResponse {
  openai: string;
  gemini: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<LLMResponse>({
    openai: '',
    gemini: '',
  });
  const [loading, setLoading] = useState({
    openai: false,
    gemini: false,
  });
  const [error, setError] = useState<string>('');

  const askQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setError('');
    setResponses({ openai: '', gemini: '' });
    setLoading({ openai: true, gemini: true });

    // Call both APIs in parallel
    const openaiPromise = fetch('/api/chat/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: question }),
    });

    const geminiPromise = fetch('/api/chat/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: question }),
    });

    // Handle OpenAI response
    openaiPromise
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setResponses((prev) => ({ ...prev, openai: `Error: ${data.error}` }));
        } else {
          setResponses((prev) => ({ ...prev, openai: data.response }));
        }
      })
      .catch((err) => {
        setResponses((prev) => ({ ...prev, openai: `Error: ${err.message}` }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, openai: false }));
      });

    // Handle Gemini response
    geminiPromise
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setResponses((prev) => ({ ...prev, gemini: `Error: ${data.error}` }));
        } else {
          setResponses((prev) => ({ ...prev, gemini: data.response }));
        }
      })
      .catch((err) => {
        setResponses((prev) => ({ ...prev, gemini: `Error: ${err.message}` }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, gemini: false }));
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8DC] relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#FFD700] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-[#4ECDC4] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-[#2C3E50] mb-3 tracking-tight transform -rotate-1">
            SUPERBRAIN
          </h1>
          <p className="text-lg text-[#34495E] font-mono">
            [ two minds • one question • zero consensus ]
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white border-4 border-[#2C3E50] rounded-none shadow-[8px_8px_0px_0px_rgba(44,62,80,1)] p-6 transform rotate-0 hover:rotate-1 transition-transform">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What's on your mind?"
              className="w-full p-4 bg-[#FFFEF9] border-2 border-[#2C3E50] font-mono text-[#2C3E50] placeholder-[#7F8C8D] resize-none focus:outline-none focus:border-[#E74C3C] transition-all"
              rows={3}
            />
            {error && (
              <p className="text-[#E74C3C] mt-2 text-sm font-mono">{error}</p>
            )}
            <button
              onClick={askQuestion}
              disabled={loading.openai || loading.gemini}
              className="mt-4 w-full py-3 px-6 bg-[#2C3E50] text-[#FFD700] font-black text-xl border-4 border-[#2C3E50] shadow-[4px_4px_0px_0px_rgba(255,215,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,215,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            >
              {loading.openai || loading.gemini ? '⚡ THINKING...' : '→ ASK THE BRAINS'}
            </button>
          </div>
        </div>

        {/* Response Section */}
        {(responses.openai || responses.gemini || loading.openai || loading.gemini) && (
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* ChatGPT Response */}
              <div className="relative">
                <div className="absolute -top-3 -left-3 bg-[#FF6B6B] text-white px-4 py-1 font-black text-sm transform -rotate-3 z-20">
                  BRAIN #1
                </div>
                <div className="bg-white border-4 border-[#2C3E50] shadow-[6px_6px_0px_0px_rgba(255,107,107,1)] p-6 transform hover:-rotate-1 transition-transform">
                  <div className="flex items-center mb-4 justify-between">
                    <h2 className="text-2xl font-black text-[#2C3E50]">CHATGPT</h2>
                    <div className="w-8 h-8 bg-[#FF6B6B] rounded-full animate-pulse"></div>
                  </div>
                  <div className="bg-[#FFFEF9] border-2 border-dashed border-[#2C3E50] p-5 min-h-[200px] max-h-[500px] overflow-y-auto">
                    {loading.openai ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-4xl animate-bounce">🤔</div>
                      </div>
                    ) : (
                      <p className="text-[#2C3E50] whitespace-pre-wrap leading-relaxed font-mono text-sm">
                        {responses.openai || 'Ready to rumble...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gemini Response */}
              <div className="relative">
                <div className="absolute -top-3 -right-3 bg-[#4ECDC4] text-white px-4 py-1 font-black text-sm transform rotate-3 z-20">
                  BRAIN #2
                </div>
                <div className="bg-white border-4 border-[#2C3E50] shadow-[6px_6px_0px_0px_rgba(78,205,196,1)] p-6 transform hover:rotate-1 transition-transform">
                  <div className="flex items-center mb-4 justify-between">
                    <h2 className="text-2xl font-black text-[#2C3E50]">GEMINI</h2>
                    <div className="w-8 h-8 bg-[#4ECDC4] rounded-full animate-pulse"></div>
                  </div>
                  <div className="bg-[#FFFEF9] border-2 border-dashed border-[#2C3E50] p-5 min-h-[200px] max-h-[500px] overflow-y-auto">
                    {loading.gemini ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-4xl animate-bounce animation-delay-500">🧐</div>
                      </div>
                    ) : (
                      <p className="text-[#2C3E50] whitespace-pre-wrap leading-relaxed font-mono text-sm">
                        {responses.gemini || 'Standing by...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}