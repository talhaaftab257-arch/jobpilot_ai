import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Bot, Sparkles } from 'lucide-react';
import { Application } from '../types';

interface CalendarProps {
  applications?: Application[];
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  time: string;
  text: string;
}

export const Calendar: React.FC<CalendarProps> = ({ applications = [] }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Ask me about interviews, follow-ups, or your application schedule. Events on the right are built from your live applications.',
    },
  ]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const calendarDays: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventDays = useMemo(() => {
    const set = new Set<number>();
    applications.forEach((a) => {
      if (!a.created_at) return;
      const d = new Date(a.created_at);
      if (d.getMonth() === month && d.getFullYear() === year) set.add(d.getDate());
    });
    return set;
  }, [applications, month, year]);

  const upcoming = useMemo(() => {
    return applications
      .filter((a) =>
        ['interview', 'ready_for_review', 'queued', 'ready', 'sent', 'submitted'].includes(
          (a.status || '').toLowerCase()
        )
      )
      .slice(0, 8)
      .map((a) => {
        const d = a.created_at ? new Date(a.created_at) : new Date();
        return {
          day: String(d.getDate()),
          title: a.status === 'interview' ? 'Interview' : 'Application',
          meta: `${a.company_name} · ${a.job_title}`,
          time: (a.status || '').replace(/_/g, ' '),
        };
      });
  }, [applications]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', time: t, text: userText }]);
    setChatInput('');
    setTimeout(() => {
      const interviewCount = applications.filter((a) => (a.status || '').toLowerCase() === 'interview').length;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'ai',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `You currently have ${applications.length} applications tracked (${interviewCount} interviews). Check Upcoming Events for items derived from live API data.`,
        },
      ]);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="type-h1 text-[#171717]">Calendar & AI Assistant</h1>
        <p className="type-body text-[#737373] mt-1">
          Coordinate interviews and follow-ups from your live applications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7E0E3] shadow-xs flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E7E0E3] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#641E32] text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="type-h2 text-[#171717] leading-tight">AI Assistant</h2>
              <p className="type-caption text-[#737373]">Ask about schedule and applications.</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) =>
              m.sender === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="bg-[#641E32] text-white p-3 rounded-2xl rounded-tr-xs max-w-[85%] type-small shadow-xs">
                    <p>{m.text}</p>
                    <span className="type-caption text-white/70 block text-right mt-1">{m.time}</span>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#641E32] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#F6F3F4] p-4 rounded-2xl rounded-tl-xs max-w-[90%] type-small border border-[#E7E0E3]">
                    <p className="leading-relaxed font-medium">{m.text}</p>
                    <span className="type-caption text-[#737373] block mt-1">{m.time}</span>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="p-3 border-t border-[#E7E0E3] bg-white">
            <div className="flex items-center gap-2 bg-[#F6F3F4] rounded-xl border border-[#E7E0E3] px-3 py-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full type-small bg-transparent outline-none text-[#171717] placeholder-[#737373]"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded-lg bg-[#641E32] text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0E3]">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg text-[#737373] cursor-default">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="type-h2 text-[#171717]">
                  {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button className="p-1.5 rounded-lg text-[#737373] cursor-default">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center type-small font-bold text-[#737373] pb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center type-small">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} className="h-9" />;
                const isHighlighted = eventDays.has(day) || day === now.getDate();
                return (
                  <div
                    key={day}
                    className={`h-9 flex items-center justify-center rounded-xl ${
                      isHighlighted
                        ? 'bg-[#641E32] text-white font-black'
                        : 'text-[#171717] font-semibold'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <h2 className="type-h2 text-[#171717] pb-2 border-b border-[#E7E0E3]">
              Upcoming Events
            </h2>
            {upcoming.length === 0 ? (
              <p className="type-small text-[#737373] py-4 text-center">
                No application events yet. When applications exist in the API, they appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#641E32] text-white flex items-center justify-center font-bold type-small shrink-0">
                        {ev.day}
                      </div>
                      <div className="min-w-0">
                        <span className="type-small font-bold text-[#171717] block">{ev.title}</span>
                        <span className="type-caption text-[#737373] block truncate">{ev.meta}</span>
                      </div>
                    </div>
                    <span className="type-small font-semibold text-[#737373] capitalize shrink-0">{ev.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
