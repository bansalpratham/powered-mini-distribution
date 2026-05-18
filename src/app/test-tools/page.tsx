'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export default function TestToolsPage() {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoadingType('reset');
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/test/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();
      setResults({
        type: 'Database Reset & Reseed',
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        details: data,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset system.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleRepeatWebhook = async () => {
    setLoadingType('webhook');
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/test/repeat-webhook', { method: 'POST' });
      if (!res.ok) throw new Error('Idempotency test failed');
      const data = await res.json();
      setResults({
        type: 'Idempotence Check (5 Parallel Requests)',
        timestamp: new Date().toLocaleTimeString(),
        eventId: data.eventId,
        message: data.message,
        details: data.results,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to trigger repeat webhook.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGenerateLeads = async () => {
    setLoadingType('leads');
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/test/generate-leads', { method: 'POST' });
      if (!res.ok) throw new Error('Concurrency test failed');
      const data = await res.json();
      setResults({
        type: 'Concurrency Check (10 Parallel Leads)',
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        details: data.results,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate concurrent leads.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          System Test Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform live load testing, check transactional quota safety, and verify API idempotence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Test suites */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" /> Action Items
          </h2>

          {/* Test 1: Reset Database */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">1. Reset System & Quotas</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Clears all custom leads, allocation histories, and event logs. Restores the 8 core providers with a quota of 10 and 0 leads received.
              </p>
            </div>
            <button
              onClick={handleReset}
              disabled={loadingType !== null}
              className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-750 cursor-pointer disabled:opacity-50"
            >
              {loadingType === 'reset' ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" /> Reset Database
                </>
              )}
            </button>
          </div>

          {/* Test 2: Idempotent Webhook */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">2. Check Webhook Idempotency</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Sends 5 identical subscription webhooks with the same unique <code className="text-indigo-400">eventId</code> simultaneously. Tests Mongoose transaction locks to ensure the quota resets only once.
              </p>
            </div>
            <button
              onClick={handleRepeatWebhook}
              disabled={loadingType !== null}
              className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-750 cursor-pointer disabled:opacity-50"
            >
              {loadingType === 'webhook' ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Verify Webhook Safety
                </>
              )}
            </button>
          </div>

          {/* Test 3: Concurrency Allocation */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">3. Concurrency Allocation</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Generates 10 leads simultaneously using parallel asynchronous requests. Tests replica set/concurrency locks to ensure round-robin balances accurately, allocations do not double-book, and provider quotas are strictly respected.
              </p>
            </div>
            <button
              onClick={handleGenerateLeads}
              disabled={loadingType !== null}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              {loadingType === 'leads' ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4" /> Generate 10 Leads Instantly
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right side: Live output monitor */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-400" /> Output Monitor
          </h2>

          <div className="flex-1 min-h-[400px] bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-xs flex flex-col justify-between shadow-inner">
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 overflow-x-auto">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Execution Failure</h4>
                    <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">{error}</pre>
                  </div>
                </div>
              </div>
            )}

            {results ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                    <span className="text-indigo-400 font-bold uppercase tracking-wider">{results.type}</span>
                    <span className="text-slate-500">{results.timestamp}</span>
                  </div>

                  <p className="text-slate-300 font-sans text-sm">{results.message}</p>

                  <div className="mt-4">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Payload Output Details:</span>
                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-850/60 leading-relaxed text-[11px]">
                      {JSON.stringify(results.details, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest text-right">
                  Logs stream captured successfully.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-650 text-center py-20 font-sans">
                <Zap className="h-10 w-10 text-slate-800 mb-2" />
                <p className="text-sm font-semibold">Ready for Execution</p>
                <p className="text-xs max-w-xs mt-1">Select one of the action buttons on the left to begin system verification.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
