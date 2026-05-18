import Link from 'next/link';
import { Sparkles, Layers, ShieldCheck, Zap, ArrowRight, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-8">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-900 text-indigo-400 text-xs font-semibold hover:bg-indigo-900/50 transition cursor-default">
          <Sparkles className="h-3 w-3 animate-pulse" /> Engineering Production Demo
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Prowider Mini Lead
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-indigo-200 to-white bg-clip-text text-transparent">
              Distribution Engine
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            A production-ready, highly concurrent backend service managing automatic, persistent round-robin lead allocation, idempotent webhooks, and real-time dashboard telemetry.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            📊 Access Dashboard <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/request-service"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl border border-slate-805 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🚀 Request Service
          </Link>
          <Link
            href="/test-tools"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-900 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🧪 Run Load Tests
          </Link>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-slate-900 mt-12">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl text-left space-y-2.5 backdrop-blur-sm">
            <div className="h-10 w-10 bg-indigo-950 border border-indigo-900 rounded-xl flex items-center justify-center">
              <Layers className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Persistent Round-Robin</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Maintains exact allocation balances for pools in MongoDB. Survives server restarts and enforces round-robin rotations strictly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl text-left space-y-2.5 backdrop-blur-sm">
            <div className="h-10 w-10 bg-indigo-950 border border-indigo-900 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Transactional Safety</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Wraps allocation pipelines and webhook resets inside MongoDB transactions, preventing race conditions or double bookings.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl text-left space-y-2.5 backdrop-blur-sm">
            <div className="h-10 w-10 bg-indigo-950 border border-indigo-900 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Server-Sent Events</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Exposes a robust, lightweight real-time stream that instantly pushes distribution logs and updates directly to your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
