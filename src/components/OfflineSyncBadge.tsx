import React, { useState } from "react";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useNetworkSync } from "../utils/offlineSync";

export const OfflineSyncBadge: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, queue, lastSyncTime, triggerSync } = useNetworkSync();
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    setStatusMsg("Isku xirka xogta ayaa socda...");
    const res = await triggerSync();
    if (res.syncedCount > 0) {
      setStatusMsg(`Si guul leh ayaa loo sync-gareeyay ${res.syncedCount} diiwaan.`);
    } else if (res.errors > 0) {
      setStatusMsg(`Sync-gu wuxuu la kulmay ${res.errors} cilad. Fadlan hubi internet-ka.`);
    } else {
      setStatusMsg("Ma jiraan xog cusub oo offline ah oo u baahan sync.");
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
          !isOnline
            ? "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50"
            : isSyncing
            ? "bg-blue-950/40 text-blue-300 border-blue-800/60 animate-pulse"
            : pendingCount > 0
            ? "bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/50"
            : "bg-emerald-950/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40"
        }`}
        title={!isOnline ? "Waxaad ku jirtaa habka Offline-ka" : "Nidaamku wuxuu ku xiran yahay internet-ka"}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Offline</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Pending Sync</span>
            <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">Online</span>
          </>
        )}
      </button>

      {/* Sync Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {!isOnline ? (
                  <WifiOff className="w-5 h-5 text-amber-400" />
                ) : (
                  <Wifi className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="font-semibold text-white">Xaaladda Internet-ka & Sync-ga</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Xaaladda Shabakadda:</span>
                <span className={`font-semibold ${isOnline ? "text-emerald-400" : "text-amber-400"}`}>
                  {isOnline ? "Waa Online (Internet-ku waa shaqeynayaa)" : "Waa Offline (Internet ma jiro)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Xogta sugaysa Sync-ga:</span>
                <span className="font-semibold text-purple-400">{pendingCount} diiwaan</span>
              </div>

              {lastSyncTime && (
                <div className="text-xs text-slate-500 text-right">
                  Sync-gii ugu dambeeyay: {new Date(lastSyncTime).toLocaleTimeString()}
                </div>
              )}

              {statusMsg && (
                <div className="p-3 bg-purple-950/50 border border-purple-800 text-purple-200 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {queue.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Liiska Xogta Sugaysa:</div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {queue.map(item => (
                      <div
                        key={item.id}
                        className="text-xs p-2 rounded bg-slate-800/80 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-white capitalize">{item.type}</span>
                          <span className="text-slate-400 ml-1.5 text-[11px]">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.status === "failed"
                              ? "bg-rose-900/60 text-rose-300 border border-rose-700"
                              : item.status === "syncing"
                              ? "bg-blue-900/60 text-blue-300 border border-blue-700"
                              : "bg-amber-900/60 text-amber-300 border border-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Markaad offline tahay, dhammaan xaadirinta iyo dhibcaha aad geliso waxaa lagu keydinayaa qalabkaaga (browser-ka). Isla marka internet-ku soo laabto si toos ah ayaa loogu shubayaa server-ka.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sync ayaa socda..." : "Hadda Sync Garee"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
