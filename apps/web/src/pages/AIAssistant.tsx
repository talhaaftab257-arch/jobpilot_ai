import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  Briefcase,
  Mail,
  Lightbulb,
  User,
  Zap
} from 'lucide-react';
import { Job, Application } from '../types';

interface AIAssistantProps {
  jobs: Job[];
  applications: Application[];
  onTriggerDiscovery: () => void;
  isDiscovering: boolean;
  onNavigate: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: Target, title: 'Analyze My Match', desc: 'Check how well you fit open positions', prompt: 'Analyze my job match score and suggest improvements' },
  { icon: Sparkles, title: 'Find Better Keywords', desc: 'Optimize your resume keywords', prompt: 'What keywords should I add to my resume for better ATS matching?' },
  { icon: Mail, title: 'Review Email Template', desc: 'Improve your outreach emails', prompt: 'Review and improve my email outreach template' },
  { icon: FileText, title: 'Generate Cover Letter', desc: 'Create a tailored cover letter', prompt: 'Generate a cover letter for my top matched job' },
  { icon: TrendingUp, title: 'Market Salary Insights', desc: 'Current salary benchmarks', prompt: 'What are the current salary ranges for AI Engineer roles in my target regions?' },
  { icon: Briefcase, title: 'Interview Prep Tips', desc: 'Prepare for upcoming interviews', prompt: 'Give me interview preparation tips for my scheduled interviews' },
];

const AI_RESPONSES: Record<string, string> = {
  default: `I've analyzed your job search profile. Here's a quick summary:\n\n**Match Score Analysis:**\n- Your average match score across discovered jobs is ~87%\n- Strongest skills: Python, FastAPI, Agentic AI, REST APIs\n- Skills gap: Consider adding Kubernetes and Terraform experience\n\n**Recommendations:**\n1. Your Pakistan CV is performing well (95% match rate)\n2. Europe region needs more cloud infrastructure keywords\n3. Consider adding more open-source contributions to boost visibility\n\nWould you like me to go deeper into any of these areas?`,

  germany: `I found 8 AI Engineer jobs in Germany posted in the last 3 days. Here are the top matches for you:\n\n1. **Senior AI Engineer** — TechSolutions (Remote)\n2. **Machine Learning Engineer** — DataForge (Berlin)\n3. **AI Research Engineer** — InnovateLab (Hybrid)\n\nWould you like me to show more details, draft an application email, or start the application process?`,

  keywords: `Based on your current resume and target job postings, here are **high-impact keywords** to add:\n\n**Must-Have:**\n- Large Language Models (LLM)\n- RAG (Retrieval-Augmented Generation)\n- Vector Databases (Pinecone, Weaviate)\n- CI/CD Pipelines\n- Kubernetes / Docker\n\n**Nice-to-Have:**\n- MLOps / Model Deployment\n- Terraform / Infrastructure as Code\n- GraphQL\n- Microservices Architecture\n\nThese keywords appear in 78% of your matched job postings. Want me to update your resume templates?`,

  email: `Here's an improved version of your outreach email:\n\n---\n**Subject:** AI Engineer — 5+ years Python/FastAPI, open to relocation\n\n**Body:**\nDear [Hiring Manager],\n\nI came across the [Position] role at [Company] and was immediately drawn to your work in [specific area]. With over 5 years building production AI systems using Python, FastAPI, and modern ML frameworks, I believe I can contribute significantly to your team.\n\nKey highlights:\n• Built agentic AI systems processing 10K+ daily requests\n• Led migration to microservices, reducing latency by 40%\n• Published research on RAG optimization techniques\n\nI'd welcome the opportunity to discuss how my experience aligns with your needs.\n\nBest regards,\nTalha Aftab Alam\n---\n\nWould you like me to customize this for a specific company?`,
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  jobs,
  applications,
  onTriggerDiscovery,
  isDiscovering,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello Talha! 👋 I'm your AI Career Assistant. I can help you with:\n\n• Analyzing job matches and improving your profile\n• Generating cover letters and email templates\n• Providing salary insights and interview prep\n• Optimizing your resume keywords for ATS\n\nYou have **${jobs.length} jobs** discovered and **${applications.length} applications** tracked. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let response = AI_RESPONSES.default;
      if (lowerText.includes('germany') || (lowerText.includes('ai engineer') && lowerText.includes('job'))) {
        response = AI_RESPONSES.germany;
      } else if (lowerText.includes('keyword') || lowerText.includes('ats')) {
        response = AI_RESPONSES.keywords;
      } else if (lowerText.includes('email') || lowerText.includes('template') || lowerText.includes('outreach')) {
        response = AI_RESPONSES.email;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left: Quick Actions Panel */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-5">
            <h2 className="type-h2 text-[#171717] mb-1">Quick Actions</h2>
            <p className="type-small text-[#737373] mb-4">Select a prompt or type your own question</p>
            
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.prompt)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-[#E7E0E3] bg-white hover:border-[#641E32] hover:bg-[#F6F3F4] transition-all cursor-pointer group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F5E9ED] flex items-center justify-center shrink-0 group-hover:bg-[#641E32] transition-colors">
                      <Icon className="w-4 h-4 text-[#641E32] group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="type-small font-bold text-[#171717] group-hover:text-[#641E32] transition-colors">{action.title}</p>
                      <p className="type-caption text-[#737373] mt-0.5">{action.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Stats Card */}
          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-5">
            <h3 className="type-h3 text-[#171717] mb-3">Your Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between type-small">
                <span className="text-[#737373]">Jobs Discovered</span>
                <span className="font-bold text-[#171717]">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between type-small">
                <span className="text-[#737373]">Applications Sent</span>
                <span className="font-bold text-[#171717]">{applications.length}</span>
              </div>
              <div className="flex items-center justify-between type-small">
                <span className="text-[#737373]">Avg Match Score</span>
                <span className="font-bold text-[#641E32]">
                  {jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + (j.match?.overall_score ?? 80), 0) / jobs.length) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chat Area */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-[#E7E0E3] shadow-xs overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E7E0E3]">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#641E32] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#16845B] border-2 border-white" />
            </div>
            <div>
              <h3 className="type-h3 text-[#171717]">AI Career Assistant</h3>
              <p className="type-caption text-[#737373]">Ask me anything about your job search</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ msg.role === 'assistant' ? 'bg-[#641E32]' : 'bg-[#F6F3F4] border border-[#E7E0E3]' }`}>
                    {msg.role === 'assistant' ? (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-[#641E32]" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${ msg.role === 'user' ? 'bg-[#641E32] text-white' : 'bg-[#F6F3F4] border border-[#E7E0E3] text-[#171717]' }`}>
                    <div className="type-body leading-relaxed whitespace-pre-wrap">
                      {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                    <p className={`type-caption mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-[#A3A3A3]'}`}>
                      {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#641E32] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#F6F3F4] border border-[#E7E0E3] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#A3A3A3] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-5 py-3 border-t border-[#E7E0E3] bg-white"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-[#F6F3F4] border border-[#E7E0E3] rounded-xl type-body text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#641E32] focus:ring-1 focus:ring-[#641E32]/20 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="p-2.5 bg-[#641E32] hover:bg-[#431321] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
