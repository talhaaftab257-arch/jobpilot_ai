import React, { useMemo, useRef, useState } from 'react';
import { FileText, RefreshCw, Trash2, CloudUpload, X, ExternalLink } from 'lucide-react';
import { Region, Resume } from '../types';
import { api } from '../services/api';

interface ResumeLibraryProps {
  regions?: Region[];
  resumes?: Resume[];
  onUploadResume?: (regionCode: string, file: File) => void;
}

function formatBytes(n?: number): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const ResumeLibrary: React.FC<ResumeLibraryProps> = ({
  regions = [],
  resumes = [],
  onUploadResume,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<{
    region: string;
    filename: string;
    skills: string[];
  } | null>(null);
  const [uploadedNotification, setUploadedNotification] = useState<string | null>(null);
  const [uploadRegion, setUploadRegion] = useState('EU');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cards = useMemo(() => {
    if (regions.length) {
      return regions.map((r) => {
        const resume =
          resumes.find((x) => x.id === r.active_resume_id) ||
          resumes.find((x) => x.storage_path?.includes(`/${r.code}/`));
        return {
          id: r.code,
          region: `${r.name} CV`,
          code: r.code,
          filename: r.active_resume_filename || resume?.filename || 'No resume uploaded',
          filesize: formatBytes(resume?.file_size_bytes),
          updated: resume?.created_at
            ? new Date(resume.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—',
          type: resume?.mime_type?.includes('pdf') ? 'PDF' : resume ? 'DOC' : '—',
          status: r.active_resume_id ? 'Active' : 'Missing',
          skills: resume?.skills_extracted || [],
        };
      });
    }

    // Fallback: group by unique filenames from API resumes
    const seen = new Set<string>();
    return resumes
      .filter((r) => {
        if (seen.has(r.filename)) return false;
        seen.add(r.filename);
        return true;
      })
      .map((r) => ({
        id: r.id,
        region: r.filename,
        code: 'EU',
        filename: r.filename,
        filesize: formatBytes(r.file_size_bytes),
        updated: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: r.mime_type?.includes('pdf') ? 'PDF' : 'DOC',
        status: r.is_active ? 'Active' : 'Inactive',
        skills: r.skills_extracted || [],
      }));
  }, [regions, resumes]);

  const handleUpload = async (file: File) => {
    try {
      if (onUploadResume) onUploadResume(uploadRegion, file);
      else await api.uploadResume(uploadRegion, file);
      setUploadedNotification(`Uploaded "${file.name}" for ${uploadRegion}.`);
      setTimeout(() => setUploadedNotification(null), 3000);
    } catch (e) {
      setUploadedNotification(`Upload failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="type-h1 text-[#171717]">Resume Library</h1>
        <p className="type-body text-[#737373] mt-1">
          Manage your regional resumes for better job matching.
        </p>
      </div>

      {uploadedNotification && (
        <div className="p-3 bg-[#ECFDF5] border border-emerald-200 text-[#16845B] type-small font-semibold rounded-xl flex items-center justify-between">
          <span>{uploadedNotification}</span>
          <button onClick={() => setUploadedNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-10 text-center type-body text-[#737373]">
          No resumes found in the API. Upload one below.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((cv) => (
            <div
              key={cv.id}
              className="bg-white rounded-2xl border border-[#E7E0E3] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5E9ED] border border-[#E7E0E3] flex items-center justify-center text-[#641E32]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="type-h3 text-[#171717]">{cv.region}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center type-caption font-bold px-2.5 py-0.5 rounded-full border ${
                      cv.status === 'Active'
                        ? 'bg-[#ECFDF5] text-[#16845B] border-emerald-200'
                        : 'bg-[#FEE2E2] text-[#C53030] border-red-200'
                    }`}
                  >
                    {cv.status}
                  </span>
                </div>
                <div className="bg-[#F6F3F4]/50 p-3 rounded-xl border border-[#E7E0E3] space-y-1">
                  <div className="type-small font-bold text-[#171717] truncate font-mono">{cv.filename}</div>
                  <div className="type-caption text-[#737373] flex items-center gap-2">
                    <span>Updated: {cv.updated}</span>
                    <span>•</span>
                    <span>{cv.type}</span>
                    <span>•</span>
                    <span>{cv.filesize}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[#E7E0E3]">
                <button
                  onClick={() =>
                    setSelectedPreview({
                      region: cv.region,
                      filename: cv.filename,
                      skills: cv.skills,
                    })
                  }
                  className="flex-1 py-2 px-3 bg-white text-[#171717] hover:bg-[#F6F3F4] type-small font-semibold rounded-xl border border-[#E7E0E3] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#737373]" />
                  Preview
                </button>
                <button
                  onClick={() => {
                    setUploadRegion(cv.code);
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-2 px-3 bg-white text-[#171717] hover:bg-[#F6F3F4] type-small font-semibold rounded-xl border border-[#E7E0E3] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#737373]" />
                  Replace
                </button>
                <button
                  className="py-2 px-3 bg-white text-[#C53030] hover:bg-red-50 type-small font-semibold rounded-xl border border-[#E7E0E3] cursor-pointer"
                  title="Remove via Settings / API"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="bg-white rounded-2xl border-2 border-dashed border-[#E7E0E3] hover:border-[#641E32] p-10 text-center transition-all cursor-pointer group shadow-xs"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleUpload(e.target.files[0]);
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-[#F5E9ED] border border-[#E7E0E3] flex items-center justify-center text-[#641E32] mx-auto mb-3">
          <CloudUpload className="w-6 h-6" />
        </div>
        <h3 className="type-h3 text-[#171717]">Upload New Resume</h3>
        <p className="type-small text-[#737373] mt-1">
          Drag and drop or <span className="text-[#641E32] font-semibold underline">click to browse</span>
        </p>
        <span className="inline-block type-caption text-[#A3A3A3] mt-2">PDF, DOC, DOCX (Max 10MB)</span>
      </div>

      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E7E0E3] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0E3]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#641E32]" />
                <h3 className="type-h3 text-[#171717]">{selectedPreview.region}</h3>
              </div>
              <button onClick={() => setSelectedPreview(null)} className="p-1 rounded-lg text-[#737373] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-[#F6F3F4] rounded-xl border border-[#E7E0E3] type-small space-y-2">
              <p className="font-bold text-[#171717] font-mono">{selectedPreview.filename}</p>
              <p className="text-[#737373]">
                Skills:{' '}
                {selectedPreview.skills.length ? selectedPreview.skills.join(', ') : 'None extracted'}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-5 py-2 bg-[#641E32] text-white type-small font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeLibrary;
