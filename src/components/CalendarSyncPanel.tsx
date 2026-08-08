import React, { useState } from 'react';
import { CalendarSyncStatus } from '../types';
import { RefreshCw, Download, CheckCircle2, ShieldCheck, ExternalLink, Globe, Lock } from 'lucide-react';

interface CalendarSyncPanelProps {
  syncStatus: CalendarSyncStatus;
  onTriggerSync: (target: 'google' | 'outlook' | 'both') => void;
}

export const CalendarSyncPanel: React.FC<CalendarSyncPanelProps> = ({
  syncStatus,
  onTriggerSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSyncClick = async (target: 'google' | 'outlook' | 'both') => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      await onTriggerSync(target);
      setSyncMessage(`Đã đồng bộ thành công dữ liệu lịch với ${target.toUpperCase()} Calendar!`);
    } catch (err) {
      setSyncMessage('Đã có lỗi xảy ra khi đồng bộ.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            Đồng Bộ Lịch 2 Chiều (Bi-directional Calendar Sync)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tự động đồng bộ thời gian biểu của Bác sĩ với Google Calendar và Microsoft Outlook Graph API
          </p>
        </div>

        <a
          href="/api/calendar/export.ics"
          download="Lich_Bac_Si_CDHA.ics"
          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Tải File iCal (.ics) Cho Điên Thoại</span>
        </a>
      </div>

      {syncMessage && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Grid of Sync Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-lg">
                G
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Google Calendar API</h3>
                <span className="text-[11px] text-blue-400 font-mono">{syncStatus.googleAccount}</span>
              </div>
            </div>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Đã Kết Nối
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Lần đồng bộ gần nhất:</span>
              <span className="font-mono text-slate-200">{syncStatus.googleLastSync || 'Vừa xong'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Chế độ đồng bộ:</span>
              <span className="text-emerald-400 font-medium">Tự động 2 chiều (Bi-directional)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Gán màu phân loại (Color coding):</span>
              <span className="text-cyan-400 font-medium">Kích hoạt</span>
            </div>
          </div>

          <button
            onClick={() => handleSyncClick('google')}
            disabled={isSyncing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ Ngay Với Google Calendar</span>
          </button>
        </div>

        {/* Microsoft Outlook Calendar Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold text-lg">
                O
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Microsoft Graph API (Outlook)</h3>
                <span className="text-[11px] text-indigo-400 font-mono">{syncStatus.outlookAccount}</span>
              </div>
            </div>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Đã Kết Nối
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Lần đồng bộ gần nhất:</span>
              <span className="font-mono text-slate-200">{syncStatus.outlookLastSync || 'Vừa xong'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Chế độ đồng bộ:</span>
              <span className="text-emerald-400 font-medium">Tự động 2 chiều (Bi-directional)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Xác thực OAuth 2.0:</span>
              <span className="text-emerald-400 font-medium">Bảo mật Token Ok</span>
            </div>
          </div>

          <button
            onClick={() => handleSyncClick('outlook')}
            disabled={isSyncing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ Ngay Với Outlook Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
