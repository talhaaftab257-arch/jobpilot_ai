import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { JobProfileConfig } from '../types';

interface EmailTemplatesProps {
  config?: JobProfileConfig;
  onSaveConfig?: (updated: Partial<JobProfileConfig>) => void;
}

const VARIABLES = [
  '{{job_title}}',
  '{{company_name}}',
  '{{your_profession}}',
  '{{your_skills}}',
  '{{name}}',
  '{{link_url}}',
];

export const EmailTemplates: React.FC<EmailTemplatesProps> = ({ config, onSaveConfig }) => {
  const [subject, setSubject] = useState(config?.email_template_subject || '');
  const [body, setBody] = useState(config?.email_template_body || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config?.email_template_subject != null) setSubject(config.email_template_subject);
    if (config?.email_template_body != null) setBody(config.email_template_body);
  }, [config?.email_template_subject, config?.email_template_body]);

  const handleSave = () => {
    onSaveConfig?.({
      email_template_subject: subject,
      email_template_body: body,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="type-h1 text-[#171717]">Email Templates</h1>
        <p className="type-body text-[#737373] mt-1">
          Create and manage your application email templates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-2">
          <span className="type-small font-bold text-[#737373] uppercase tracking-wider block mb-2">
            Templates
          </span>
          <button className="w-full text-left p-3.5 rounded-xl font-bold type-body bg-[#641E32] text-white border border-[#641E32] shadow-xs cursor-pointer">
            Application Email
          </button>
          <p className="type-caption text-[#737373] px-1">
            Loaded from your live config (`email_template_subject` / `email_template_body`).
          </p>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="type-small font-bold text-[#171717] block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0E3] type-body text-[#171717] focus:outline-none focus:border-[#641E32] font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="type-small font-bold text-[#171717]">Body Content</label>
            <textarea
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#E7E0E3] type-body text-[#171717] leading-relaxed focus:outline-none focus:border-[#641E32] font-mono resize-none bg-[#FDFCFD]"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#641E32] hover:bg-[#431321] text-white type-body font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Template Saved' : 'Save Template'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
          <div>
            <h3 className="type-h3 text-[#171717]">Variables</h3>
            <p className="type-caption text-[#737373] mt-0.5">Click to insert into body.</p>
          </div>
          <div className="space-y-2">
            {VARIABLES.map((v) => (
              <button
                key={v}
                onClick={() => setBody((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${v}`)}
                className="w-full text-left p-2.5 rounded-xl bg-[#F6F3F4] hover:bg-[#F5E9ED] text-[#171717] border border-[#E7E0E3] type-small font-mono font-semibold cursor-pointer"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
