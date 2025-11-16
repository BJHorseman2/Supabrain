'use client';

import { useState } from 'react';

interface LLMResponse {
  openai: string;
  gemini: string;
  claude: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<LLMResponse>({
    openai: '',
    gemini: '',
    claude: '',
  });
  const [loading, setLoading] = useState({
    openai: false,
    gemini: false,
    claude: false,
  });
  const [error, setError] = useState<string>('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [searchContext, setSearchContext] = useState<string>('');

  const askQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setError('');
    setResponses({ openai: '', gemini: '', claude: '' });
    setLoading({ openai: true, gemini: true, claude: true });
    setSearchContext('');

    let finalQuestion = question;

    // If web search is enabled, fetch current information first
    if (useWebSearch) {
      try {
        const searchResponse = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: question }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.context) {
            setSearchContext(searchData.context);
            finalQuestion = `${searchData.context}\n\nQuestion: ${question}`;
          }
        }
      } catch (err) {
        console.error('Search failed, continuing without context:', err);
      }
    }

    // Call all three APIs in parallel
    const openaiPromise = fetch('/api/chat/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: finalQuestion }),
    });

    const geminiPromise = fetch('/api/chat/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: finalQuestion }),
    });

    const claudePromise = fetch('/api/chat/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: finalQuestion }),
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

    // Handle Claude response
    claudePromise
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setResponses((prev) => ({ ...prev, claude: `Error: ${data.error}` }));
        } else {
          setResponses((prev) => ({ ...prev, claude: data.response }));
        }
      })
      .catch((err) => {
        setResponses((prev) => ({ ...prev, claude: `Error: ${err.message}` }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, claude: false }));
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
            [ three minds • one question • zero consensus ]
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white border-4 border-[#2C3E50] rounded-none shadow-[8px_8px_0px_0px_rgba(44,62,80,1)] p-6 transform rotate-0 hover:rotate-1 transition-transform">
            {/* Web Search Toggle */}
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="w-5 h-5 mr-3 accent-[#FFD700]"
                />
                <span className="text-[#2C3E50] font-mono font-bold">
                  🔍 Use Web Search for Current Info
                </span>
              </label>
              {useWebSearch && (
                <span className="text-xs text-[#7F8C8D] font-mono">
                  Will search the web first
                </span>
              )}
            </div>
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
              disabled={loading.openai || loading.gemini || loading.claude}
              className="mt-4 w-full py-3 px-6 bg-[#2C3E50] text-[#FFD700] font-black text-xl border-4 border-[#2C3E50] shadow-[4px_4px_0px_0px_rgba(255,215,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,215,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            >
              {loading.openai || loading.gemini || loading.claude ? '⚡ THINKING...' : '→ ASK THE BRAINS'}
            </button>
          </div>
        </div>

        {/* Search Context Indicator */}
        {searchContext && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-[#FFD700] bg-opacity-20 border-2 border-[#FFD700] rounded-none p-3">
              <p className="text-sm font-mono text-[#2C3E50]">
                🔍 Web search completed - Current information added to context
              </p>
            </div>
          </div>
        )}

        {/* Response Section */}
        {(responses.openai || responses.gemini || responses.claude || loading.openai || loading.gemini || loading.claude) && (
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
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
                <div className="absolute -top-3 -left-3 bg-[#4ECDC4] text-white px-4 py-1 font-black text-sm transform rotate-2 z-20">
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

              {/* Claude Response */}
              <div className="relative">
                <div className="absolute -top-3 -right-3 bg-[#9B59B6] text-white px-4 py-1 font-black text-sm transform rotate-3 z-20">
                  BRAIN #3
                </div>
                <div className="bg-white border-4 border-[#2C3E50] shadow-[6px_6px_0px_0px_rgba(155,89,182,1)] p-6 transform hover:-rotate-1 transition-transform">
                  <div className="flex items-center mb-4 justify-between">
                    <h2 className="text-2xl font-black text-[#2C3E50]">CLAUDE</h2>
                    <div className="w-8 h-8 bg-[#9B59B6] rounded-full animate-pulse"></div>
                  </div>
                  <div className="bg-[#FFFEF9] border-2 border-dashed border-[#2C3E50] p-5 min-h-[200px] max-h-[500px] overflow-y-auto">
                    {loading.claude ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-4xl animate-bounce animation-delay-1000">🤓</div>
                      </div>
                    ) : (
                      <p className="text-[#2C3E50] whitespace-pre-wrap leading-relaxed font-mono text-sm">
                        {responses.claude || 'Ready to assist...'}
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