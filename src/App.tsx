import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Users, Download, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

const SESSIONS = [
  { id: '22474', date: '2026/07/03 (五) 19:00', isSoldOut: false },
  { id: '22475', date: '2026/07/04 (六) 18:30', isSoldOut: false },
  { id: '22476', date: '2026/07/05 (日) 18:30', isSoldOut: false },
  { id: '22478', date: '2026/07/08 (三) 19:00', isSoldOut: false },
  { id: '22479', date: '2026/07/10 (五) 19:00', isSoldOut: false },
  { id: '22480', date: '2026/07/11 (六) 18:30', isSoldOut: true },
  { id: '22481', date: '2026/07/12 (日) 18:30', isSoldOut: true }
];

interface SessionState {
  html: string | null;
  isLoading: boolean;
  error: string | null;
}

const parseHtmlForAreas = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const areaElements = doc.querySelectorAll('.area-list li');
  const areasList: { areaName: string; remaining: number }[] = [];
  areaElements.forEach((li) => {
    const text = li.textContent || '';
    if (text.includes('剩餘')) {
      const match = text.match(/剩餘\s*(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        let areaName = text.replace(/剩餘\s*\d+/, '').trim();
        areaName = areaName.replace(/\s+/g, ' ');
        areasList.push({ areaName, remaining: num });
      }
    }
  });
  return areasList;
};

const SessionCard = ({ session, capacity, data, onFetch, onDownload, compact }: any) => {
  const { html, isLoading, error } = data || {};
  
  const { remaining, sold, areas } = useMemo(() => {
    if (session.isSoldOut) return { remaining: 0, sold: capacity, areas: [] };
    if (!html) return { remaining: 0, sold: 0, areas: [] };

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const areaElements = doc.querySelectorAll('.area-list li');
    
    let totalRemaining = 0;
    const areasList: { areaName: string; remaining: number }[] = [];
    
    areaElements.forEach((li) => {
      const text = li.textContent || '';
      if (text.includes('剩餘')) {
        const match = text.match(/剩餘\s*(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          totalRemaining += num;
          let areaName = text.replace(/剩餘\s*\d+/, '').trim();
          areaName = areaName.replace(/\s+/g, ' ');
          areasList.push({ areaName, remaining: num });
        }
      }
    });

    const calculatedSold = Math.max(0, capacity - totalRemaining);
    return { remaining: totalRemaining, sold: calculatedSold, areas: areasList };
  }, [html, capacity, session.isSoldOut]);

  const hasFetched = session.isSoldOut || !!html;
  const soldPercentage = capacity > 0 && hasFetched ? (sold / capacity) * 100 : 0;

  return (
    <div className={`bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-md border border-neutral-200 ${compact ? 'p-3' : 'p-4'} flex flex-col justify-between transition-all`}>
      <div>
        <div className={`flex justify-between items-start ${compact ? 'mb-2.5' : 'mb-4'}`}>
          <h3 className={`font-bold ${compact ? 'text-[13px]' : 'text-[13px]'} tracking-tight text-neutral-800 leading-tight pr-1`}>{session.date}</h3>
          {session.isSoldOut && <span className={`bg-red-50 border border-red-100 text-red-600 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[10px] px-1.5 py-0.5'} rounded font-bold whitespace-nowrap`}>已售完</span>}
        </div>
        
        {error ? (
          <div className={`text-[11px] text-red-600 flex items-start space-x-1.5 ${compact ? 'mb-2 p-2' : 'mb-4 p-2.5'} bg-red-50/50 rounded-lg border border-red-100 leading-snug`}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="line-clamp-3">{error}</span>
          </div>
        ) : (
          <div className={`${compact ? 'space-y-2.5 mb-4' : 'space-y-3 mb-5'}`}>
            <div className={`flex justify-between items-baseline border-b border-neutral-50 ${compact ? 'pb-1.5' : 'pb-2'}`}>
              <span className={`${compact ? 'text-xs' : 'text-xs'} font-semibold text-neutral-400`}>已售出</span>
              <span className={`${compact ? 'text-base' : 'text-base'} font-bold text-neutral-900 tracking-tight`}>{hasFetched ? sold.toLocaleString() : '-'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={`${compact ? 'text-xs' : 'text-xs'} font-semibold text-neutral-400`}>剩餘</span>
              <span className={`${compact ? 'text-lg' : 'text-lg'} font-bold text-blue-600 tracking-tight`}>{hasFetched ? remaining.toLocaleString() : '-'}</span>
            </div>
            
            <div className="w-full bg-neutral-100 rounded-full h-1 mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-1 hover:bg-blue-400 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, soldPercentage)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-auto">
        {!session.isSoldOut && (
          <button 
            onClick={async () => {
              if (hasFetched && areas.length > 0) {
                onDownload(areas);
              } else {
                const fetchedHtml = await onFetch();
                if (fetchedHtml) {
                  const fetchedAreas = parseHtmlForAreas(fetchedHtml);
                  if (fetchedAreas.length > 0) {
                    onDownload(fetchedAreas);
                  }
                }
              }
            }}
            disabled={isLoading}
            className={`w-full flex justify-center items-center space-x-1.5 ${compact ? 'py-2' : 'py-2'} bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 ${compact ? 'text-[11px]' : 'text-xs'} font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50`}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin text-neutral-400" /> : <Download size={14} className="text-neutral-400" />}
            <span>{compact ? '下載各區餘票 (CSV)' : '下載各區剩餘票 (CSV)'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [capacity, setCapacity] = useState<number>(40000);
  const [isExtension] = useState<boolean>(typeof chrome !== 'undefined' && !!chrome.runtime);
  const [sessionsData, setSessionsData] = useState<Record<string, SessionState>>({});
  const [isFetchingAll, setIsFetchingAll] = useState<boolean>(false);

  useEffect(() => {
    if (isExtension) {
      document.documentElement.style.width = `800px`;
      document.documentElement.style.height = `600px`;
      document.body.style.width = `800px`;
      document.body.style.height = `600px`;
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, [isExtension]);

  const handleFetchData = async (sessionId: string) => {
    setSessionsData(prev => ({ ...prev, [sessionId]: { html: null, isLoading: true, error: null } }));
    try {
      if (isExtension && chrome?.tabs && chrome?.scripting) {
        const tabs = await chrome.tabs.query({ url: "*://*.tixcraft.com/*" });
        if (tabs.length === 0) {
          throw new Error("請先在瀏覽器開啟 tixcraft.com (任意頁面即可)，並確認已通過驗證！");
        }
        
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id as number },
          func: async (session) => {
            try {
              const res = await window.fetch(`https://tixcraft.com/ticket/area/26_maydaytp/${session}`);
              if (!res.ok) {
                 return { error: true, status: res.status };
              }
              const text = await res.text();
              return { error: false, text };
            } catch (e: any) {
              return { error: true, status: e.message || 'Fetch Failed' };
            }
          },
          args: [sessionId]
        });
        
        const result = results[0]?.result;
        if (result?.error) {
          throw new Error(`HTTP ${result.status} (請重整拓元頁面保持登入連線)`);
        }
        if (result?.text) {
          setSessionsData(prev => ({ ...prev, [sessionId]: { html: result.text, isLoading: false, error: null } }));
          return result.text;
        } else {
          throw new Error("未能取得回傳值，請重試。");
        }
      } else {
        const url = `/api/tickets/${sessionId}`;
        const response = await fetch(url);
        if (!response.ok) {
          let errorMsg = `HTTP ${response.status} 錯誤`;
          try {
            const errData = await response.json();
            if (errData.error) errorMsg = errData.error;
          } catch (_) {
            errorMsg = `預覽模式下由於伺服器防護，無法直接獲取資料。請匯出擴充功能。`;
          }
          throw new Error(errorMsg);
        }
        const text = await response.text();
        setSessionsData(prev => ({ ...prev, [sessionId]: { html: text, isLoading: false, error: null } }));
        return text;
      }
    } catch (err) {
      setSessionsData(prev => ({ ...prev, [sessionId]: { html: null, isLoading: false, error: err instanceof Error ? err.message : '發生未知錯誤' } }));
    }
  };

  const handleFetchAll = async () => {
    setIsFetchingAll(true);
    // Sequence fetch to not hit rapid-fire rate limits
    for (const session of SESSIONS) {
      if (!session.isSoldOut) {
         await handleFetchData(session.id);
         await new Promise(r => setTimeout(r, 600)); 
      }
    }
    setIsFetchingAll(false);
  };

  const handleDownloadCSV = (areas: { areaName: string; remaining: number }[], sessionDate: string) => {
    if (areas.length === 0) return;
    
    const BOM = '\uFEFF';
    const csvContent = BOM + ['區域 (Area),剩餘票數 (Remaining)']
      .concat(areas.map(a => `"${a.areaName}",${a.remaining}`))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateFormatted = sessionDate.replace(/\s+/g, '_').replace(/[^\w_-]/g, '');
    link.setAttribute('download', `ticket_remaining_${dateFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerClass = isExtension 
    ? "bg-neutral-50 text-neutral-900 font-sans flex flex-col items-center py-4 overflow-x-hidden overflow-y-auto relative h-screen w-screen" 
    : "min-h-screen bg-neutral-50 text-neutral-900 font-sans p-6 md:p-8 overflow-auto relative";
    
  return (
    <div className={containerClass}>
      <div className={`${isExtension ? 'w-[700px]' : 'max-w-7xl'} mx-auto h-full flex flex-col`}>
        
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between bg-white ${isExtension ? 'p-3 mb-3' : 'p-4 md:p-5 mb-5'} rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-neutral-100 gap-3 md:gap-4`}>
          <div className="flex items-center space-x-3 md:space-x-5">
            <div className="flex items-center space-x-2.5">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                <Ticket size={24} />
              </div>
              <h1 className={`${isExtension ? 'text-base line-clamp-1 max-w-[200px]' : 'text-lg md:text-xl'} font-extrabold tracking-tight text-neutral-900`}>五月天[回到那一天]｜台北站</h1>
            </div>
            
            <div className="hidden sm:block h-8 w-px bg-neutral-100"></div>
            
            <div className="flex items-center space-x-2 md:space-x-3 bg-neutral-50 px-2 md:px-3 py-1.5 rounded-lg border border-neutral-100">
              <label className={`${isExtension ? 'text-[10px]' : 'text-xs'} font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap`}>預估總人數</label>
              <div className="relative flex items-center">
                <Users className="absolute left-2 text-neutral-400" size={14} />
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                  className={`pl-7 pr-2 py-1 ${isExtension ? 'w-24' : 'w-24 sm:w-32'} bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-neutral-700 shadow-sm transition-all`}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleFetchAll}
              disabled={isFetchingAll}
              className={`flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ${isExtension ? 'px-3 py-1.5' : 'px-5 py-2.5'} rounded-xl ${isExtension ? 'text-xs' : 'text-sm'} font-bold shadow-[0_2px_8px_-3px_rgba(37,99,235,0.4)] transition-all disabled:opacity-70 disabled:cursor-wait`}
            >
              {isFetchingAll ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>{isFetchingAll ? '更新中' : '全部更新'}</span>
            </button>
          </div>
        </div>

        {/* Extension check warning */}
        {!isExtension && (
          <div className="mb-5 p-4 bg-blue-50/70 rounded-xl border border-blue-100 text-sm text-blue-800 flex items-start space-x-3 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <AlertTriangle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold flex items-center">目前為網頁預覽環境</p>
              <p className="mt-0.5 text-blue-700/80">點擊右上方 <strong>Export</strong> {'->'} <strong>Download ZIP</strong> 即可匯出，在 Chrome 擴充功能中載入解壓後的 <strong>dist</strong> 資料夾即可突破網頁防護真實抓取資料。</p>
            </div>
          </div>
        )}

        {/* Grid layout for Cards */}
        <div className={`grid ${isExtension ? 'grid-cols-3 gap-3 w-full' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'} pb-4`}>
          {SESSIONS.map(session => (
             <SessionCard 
               key={session.id} 
               session={session} 
               capacity={capacity} 
               data={sessionsData[session.id]} 
               onFetch={() => handleFetchData(session.id)}
               onDownload={(areas: any) => handleDownloadCSV(areas, session.date)}
               compact={isExtension}
             />
          ))}
        </div>

      </div>
    </div>
  );
}
