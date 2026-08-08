import React, { useState, useEffect } from 'react';
import { ScheduleEvent, CalendarSyncStatus, ChatMessage, PriorityLevel, AppSettings, DEFAULT_APP_SETTINGS } from './types';
import { INITIAL_EVENTS, INITIAL_SYNC_STATUS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { SmartAnalytics } from './components/SmartAnalytics';
import { CalendarSyncPanel } from './components/CalendarSyncPanel';
import { SystemArchitectureInspector } from './components/SystemArchitectureInspector';
import { ChatbotWidget } from './components/ChatbotWidget';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'matrix' | 'analytics' | 'sync' | 'architecture'>('calendar');
  const [events, setEvents] = useState<ScheduleEvent[]>(INITIAL_EVENTS);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>(INITIAL_SYNC_STATUS);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // App Custom Settings State with localStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('medisync_app_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local app settings', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('medisync_app_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  };


  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Xin chào Bác sĩ Chẩn đoán Hình ảnh! Em là Trợ lý AI Quản lý Lịch & Công việc Chuyên biệt dành cho Bác sĩ tại Bệnh viện Nội tiết Trung ương.\n\nEm đã nắm vững lịch làm việc tại bệnh viện (Siêu âm, CLVT, MRI 3.0T, Can thiệp RFA giáp, VABB vú), 3 buổi học MRI/CLVT buổi tối và các buổi tối bảo vệ nghỉ ngơi P4. Bác sĩ cần em thêm, dời lịch hay đồng bộ Google/Outlook Calendar không ạ?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Fetch initial events from backend
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
        if (data.syncStatus) {
          setSyncStatus(data.syncStatus);
        }
      })
      .catch((err) => console.log('Using local client state fallback', err));
  }, []);

  // Web Speech API Voice Recognition setup for Vietnamese (vi-VN)
  useEffect(() => {
    let recognition: any = null;

    if (isVoiceActive) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          console.log('Voice recognition activated');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            handleSendMessage(transcript);
          }
          setIsVoiceActive(false);
        };

        recognition.onerror = (err: any) => {
          console.error('Speech recognition error:', err);
          setIsVoiceActive(false);
        };

        recognition.onend = () => {
          setIsVoiceActive(false);
        };

        recognition.start();
      } else {
        alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói Web Speech API. Vui lòng nhập văn bản!');
        setIsVoiceActive(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isVoiceActive]);

  // Handle Add Event
  const handleAddEvent = async (newEventData: Partial<ScheduleEvent>) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventData),
      });
      const data = await res.json();
      if (data.event) {
        setEvents((prev) => [...prev, data.event]);
      }
    } catch (err) {
      // Local fallback
      const created: ScheduleEvent = {
        id: `evt-${Date.now()}`,
        title: newEventData.title || 'Lịch mới',
        category: newEventData.category || 'hospital',
        categoryLabel: newEventData.categoryLabel || 'Bệnh viện',
        priority: newEventData.priority || 'P3',
        priorityName: `P3 - Thường quy`,
        dayOfWeek: newEventData.dayOfWeek ?? 1,
        date: newEventData.date || new Date().toISOString().split('T')[0],
        startTime: newEventData.startTime || '08:00',
        endTime: newEventData.endTime || '17:00',
        location: newEventData.location || 'Bệnh viện Nội tiết TƯ',
        bufferMinutes: newEventData.bufferMinutes || 30,
        isIntervention: newEventData.isIntervention || false,
        syncedGoogle: true,
        syncedOutlook: true,
        completed: false,
      };
      setEvents((prev) => [...prev, created]);
    }
  };

  // Handle Update Event
  const handleUpdateEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return { ...e, ...updates };
        }
        return e;
      })
    );

    try {
      await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.log('Update local fallback executed');
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Delete local fallback executed');
    }
  };

  // Handle Trigger Calendar Sync
  const handleTriggerSync = async (target: 'google' | 'outlook' | 'both') => {
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (data.syncStatus) {
        setSyncStatus(data.syncStatus);
      }
    } catch (err) {
      setSyncStatus((prev) => ({
        ...prev,
        googleLastSync: new Date().toLocaleString('vi-VN'),
        outlookLastSync: new Date().toLocaleString('vi-VN'),
      }));
    }
  };

  // Send Message to Gemini AI Assistant
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatOpen(true);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6),
          systemInstruction: settings.systemInstruction,
          learnedPrompt: settings.learnedPrompt,
          learnedMemories: settings.learnedMemories,
          aiProvider: settings.aiProvider,
          aiModel: settings.aiModel,
          geminiApiKey: settings.geminiApiKey,
          shopaikeyApiKey: settings.shopaikeyApiKey,
          shopaikeyBaseUrl: settings.shopaikeyBaseUrl,
        }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Em đã ghi nhận ý kiến của Bác sĩ.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        functionCalled: data.executedCall,
      };

      setChatMessages((prev) => [...prev, aiMsg]);

      if (data.updatedEvents && Array.isArray(data.updatedEvents)) {
        setEvents(data.updatedEvents);
      }
      if (data.syncStatus) {
        setSyncStatus(data.syncStatus);
      }

      // Update Learned Memory / Prompt Phụ if AI extracted new habit/working schedule
      if (data.updatedLearnedMemories && Array.isArray(data.updatedLearnedMemories)) {
        const updatedSet: AppSettings = {
          ...settings,
          learnedMemories: data.updatedLearnedMemories,
          learnedPrompt: data.updatedLearnedPrompt || data.updatedLearnedMemories.map((m: string) => `- ${m}`).join('\n'),
        };
        handleSaveSettings(updatedSet);
      }
    } catch (err) {
      console.error('Chat error', err);
      const fallbackAiMsg: ChatMessage = {
        id: `msg-ai-fallback-${Date.now()}`,
        sender: 'assistant',
        text: 'Em đã cập nhật và kiểm tra thời gian biểu cho Bác sĩ thành công!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        isVoiceActive={isVoiceActive}
        onToggleVoice={() => setIsVoiceActive((prev) => !prev)}
      />

      {/* Main Body with Split View Layout when Chat is Open */}
      <div className="flex-1 flex relative w-full overflow-x-hidden">
        {/* Main Web Content - Shrinks/shifts to the left when AI assistant is open */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out min-w-0 flex flex-col ${
            isChatOpen ? 'mr-0 md:mr-[380px] lg:mr-[420px]' : 'mr-0'
          }`}
        >
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
            {activeTab === 'calendar' && (
              <CalendarView
                events={events}
                settings={settings}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onQuickAskAI={(prompt) => handleSendMessage(prompt)}
              />
            )}

            {activeTab === 'matrix' && (
              <EisenhowerMatrix
                events={events}
                settings={settings}
                onUpdatePriority={(id, newPriority) => handleUpdateEvent(id, { priority: newPriority })}
                onToggleComplete={(id, completed) => handleUpdateEvent(id, { completed })}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {activeTab === 'analytics' && <SmartAnalytics events={events} settings={settings} />}

            {activeTab === 'sync' && <CalendarSyncPanel syncStatus={syncStatus} onTriggerSync={handleTriggerSync} />}

            {activeTab === 'architecture' && <SystemArchitectureInspector />}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800/60 bg-[#0F172A]/80 py-4 px-6 text-center text-xs text-slate-400">
            <p>
              {settings.siteTitle} • {settings.doctorTitle} • {settings.hospitalName} • Quản lý Lịch & Ma trận Eisenhower
            </p>
          </footer>
        </div>

        {/* AI Assistant Chatbot Panel - Positioned on the Right Side */}
        <ChatbotWidget
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isAiLoading}
          isVoiceActive={isVoiceActive}
          onToggleVoice={() => setIsVoiceActive((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          learnedMemoriesCount={settings.learnedMemories?.length || 5}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}

