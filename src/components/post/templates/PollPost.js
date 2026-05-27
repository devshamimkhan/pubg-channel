'use client';
import { useState } from 'react';

export default function PollPost({ post }) {
  const [selected, setSelected] = useState(null);
  
  const options = post.templateData?.pollOptions || [
    { id: 1, text: 'PUBG Mobile', votes: 1420, percent: 65 },
    { id: 2, text: 'Free Fire', votes: 480, percent: 22 },
    { id: 3, text: 'Valorant', votes: 285, percent: 13 }
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-card2)] flex items-center justify-center text-[var(--gold)]">
          <i className="fas fa-poll"></i>
        </div>
        <div>
          <h3 className="font-raj font-bold text-[17px] leading-tight">{post.title || 'What is your favorite game?'}</h3>
          <div className="text-[11px] text-[var(--text-muted)]">Select one option</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4 mb-3">
        {options.map((opt) => (
          <div 
            key={opt.id} 
            className={`relative overflow-hidden border rounded-lg cursor-pointer transition-colors ${
              selected === opt.id ? 'border-[var(--gold)] bg-[rgba(250,186,37,.05)]' : 'border-[var(--border)] bg-[var(--bg-card2)] hover:border-[var(--gold-dim)]'
            }`}
            onClick={() => setSelected(opt.id)}
          >
            {/* Progress Bar Background */}
            <div 
              className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                selected === opt.id ? 'bg-[rgba(250,186,37,.15)]' : 'bg-[rgba(255,255,255,.03)]'
              }`}
              style={{ width: `${opt.percent}%` }}
            ></div>
            
            <div className="relative z-10 flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  selected === opt.id ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-[var(--text-sub)]'
                }`}>
                  {selected === opt.id && <div className="w-1.5 h-1.5 bg-[#000] rounded-full"></div>}
                </div>
                <span className={`text-[14px] font-medium ${selected === opt.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                  {opt.text}
                </span>
              </div>
              <div className="text-[12px] font-bold text-[var(--text-main)]">
                {opt.percent}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-[11px] text-[var(--text-sub)] px-1">
        <div>2,185 votes</div>
        <div>Ends in 2 days</div>
      </div>
    </>
  );
}
