'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import io from 'socket.io-client';

interface Lead {
  assignmentId: string;
  assignedAt: string;
  leadId: string;
  name: string;
  phone: string;
  city: string;
  description: string;
  service: string;
}

interface ProviderDashboardInfo {
  _id: string;
  name: string;
  monthlyQuota: number;
  leadsReceivedCount: number;
  remainingQuota: number;
  active: boolean;
  leads: Lead[];
}

interface GlobalLead {
  _id: string;
  name: string;
  phone: string;
  city: string;
  service: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<ProviderDashboardInfo[]>([]);
  const [globalLeads, setGlobalLeads] = useState<GlobalLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeMethod, setRealtimeMethod] = useState<'SSE' | 'Socket.IO' | 'None'>('None');
  const [updateIndicator, setUpdateIndicator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      setProviders(data.providers || []);
      setGlobalLeads(data.leads || []);
      setError(null);

      // Flash visual indicator for real-time update
      if (isSilent) {
        setUpdateIndicator(true);
        setTimeout(() => setUpdateIndicator(false), 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Fetch
    fetchDashboardData();

    let socket: ReturnType<typeof io> | null = null;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    // Establish Socket.IO or SSE Fallback
    async function initializeRealtime() {
      try {
        // Initialize Socket.io server by calling the server endpoint
        await fetch('/api/socket/io');
        
        socket = io(window.location.origin, {
          path: '/api/socket/io',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
        });

        socket.on('connect', () => {
          console.log('Socket.IO client connected!');
          setRealtimeMethod('Socket.IO');
        });

        socket.on('dashboard_update', (payload: any) => {
          console.log('Socket.IO event received:', payload);
          fetchDashboardData(true);
        });

        socket.on('connect_error', (err: any) => {
          console.log('Socket.IO connection failed, falling back to SSE...', err);
          socket?.disconnect();
          socket = null;
          connectSSE();
        });
      } catch (err) {
        console.error('Socket.IO initialization failed, using SSE...', err);
        connectSSE();
      }
    }

    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/dashboard/sse');
      setRealtimeMethod('SSE');

      eventSource.onopen = () => {
        console.log('SSE Fallback connected!');
      };

      eventSource.onerror = (e) => {
        console.error('SSE connection error, attempting reconnect...', e);
        setRealtimeMethod('None');
        eventSource?.close();

        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event !== 'connected') {
            console.log('SSE update received, refetching dashboard:', payload);
            fetchDashboardData(true);
          }
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      };
    }

    initializeRealtime();

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const realtimeConnected = realtimeMethod !== 'None';

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header section with live feed status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Lead Distribution Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time visual monitoring of providers, quotas, allocations, and service logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {updateIndicator && (
            <span className="flex items-center gap-1 text-xs text-indigo-400 animate-pulse bg-indigo-950 border border-indigo-900 px-2.5 py-1 rounded-full font-medium">
              <RefreshCw className="h-3 w-3 animate-spin" /> Auto-syncing...
            </span>
          )}

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              realtimeConnected
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-rose-950/60 border-rose-800 text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {realtimeConnected ? `Live Connection: ${realtimeMethod}` : 'Disconnected'}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
          <p className="font-bold text-sm">Failed to connect to core system:</p>
          <p className="text-xs mt-1 text-slate-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-slate-400 text-sm font-medium">Loading distribution logs...</span>
        </div>
      ) : (
        <>
          {/* Providers Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> Active Providers ({providers.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {providers.map((p) => {
                const percentUsed = Math.min(100, (p.leadsReceivedCount / p.monthlyQuota) * 100);
                const isExhausted = p.leadsReceivedCount >= p.monthlyQuota;

                return (
                  <div
                    key={p._id}
                    className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-md ${
                      isExhausted
                        ? 'border-rose-950/80 bg-rose-950/10'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-200 text-base">{p.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isExhausted
                              ? 'bg-rose-950 border border-rose-900 text-rose-400'
                              : 'bg-indigo-950 border border-indigo-900 text-indigo-400'
                          }`}
                        >
                          {isExhausted ? 'Exhausted' : 'Active'}
                        </span>
                      </div>

                      {/* Quota Progress */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Quota Usage</span>
                          <span className={isExhausted ? 'text-rose-400' : 'text-slate-200'}>
                            {p.leadsReceivedCount} / {p.monthlyQuota} leads
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isExhausted ? 'bg-rose-600' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-950 pt-4 flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Remaining: <span className="text-slate-300 font-semibold">{p.remainingQuota}</span>
                      </div>
                      <div className="text-[11.5px] font-medium text-slate-400">
                        Total Received: <span className="text-indigo-400 font-bold">{p.leads.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Provider Lead Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Providers detailed list */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" /> Assigned Leads by Provider
              </h2>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {providers.map((p) => (
                  <div key={p._id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-950 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white">{p.name}</h3>
                        <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-850">
                          {p.leads.length} assignments
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        Remaining: <strong className="text-white">{p.remainingQuota}</strong>
                      </span>
                    </div>

                    {p.leads.length === 0 ? (
                      <div className="text-center py-6 text-slate-600 text-xs italic">
                        No leads assigned to this provider yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-950/60">
                              <th className="pb-2 font-bold uppercase tracking-wider">Customer</th>
                              <th className="pb-2 font-bold uppercase tracking-wider">Service</th>
                              <th className="pb-2 font-bold uppercase tracking-wider">Phone / City</th>
                              <th className="pb-2 font-bold uppercase tracking-wider">Assigned At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-950/30">
                            {p.leads.map((lead) => (
                              <tr key={lead.assignmentId} className="text-slate-300 hover:bg-slate-950/20">
                                <td className="py-2.5 font-semibold text-slate-100">{lead.name}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900/40 text-[10px] font-semibold">
                                    {lead.service}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <div>{lead.phone}</div>
                                  <div className="text-slate-500 text-[10px]">{lead.city}</div>
                                </td>
                                <td className="py-2.5 text-slate-400 text-[11px]">
                                  {new Date(lead.assignedAt).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Global Lead Stream */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" /> Incoming Lead Feed ({globalLeads.length})
              </h2>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm max-h-[600px] overflow-y-auto flex flex-col gap-4">
                {globalLeads.length === 0 ? (
                  <div className="text-center py-16 text-slate-600 text-xs italic flex-1 flex flex-col items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-slate-700 mb-2" /> No lead requests captured yet.
                  </div>
                ) : (
                  globalLeads.map((l) => (
                    <div key={l._id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-800 transition">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-white text-sm">{l.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold uppercase">
                          {l.service}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-0.5">
                        <div>📞 Phone: <span className="text-slate-200">{l.phone}</span></div>
                        <div>📍 City: <span className="text-slate-200">{l.city}</span></div>
                        <div className="text-slate-500 text-[10px] pt-1">
                          ⏰ Received: {new Date(l.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <p className="text-slate-300 text-xs italic bg-slate-900/80 border border-slate-950 p-2.5 rounded-lg mt-2">
                        "{l.description}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
