'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface Service {
  _id: string;
  name: string;
}

interface AssignedProvider {
  id: string;
  name: string;
}

export default function RequestServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    serviceId: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [successData, setSuccessData] = useState<{
    lead: any;
    assignedProviders: AssignedProvider[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.services) {
          setServices(data.services);
          if (data.services.length > 0) {
            setFormData((prev) => ({ ...prev, serviceId: data.services[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch services', err);
        setError('Failed to fetch available services. Is the backend running?');
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessData(null);

    // Basic validation
    if (!formData.name || !formData.phone || !formData.city || !formData.serviceId || !formData.description) {
      setError('Please fill in all the fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSuccessData({
        lead: data.lead,
        assignedProviders: data.assignedProviders,
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        city: '',
        serviceId: services[0]?._id || '',
        description: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4 flex-1 flex flex-col justify-center">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="h-3 w-3" /> Customer Hub
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Request a Service
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Submit your requirements and our intelligent distribution engine will match you with the best providers instantly.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        {successData && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5.5 w-5.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-white">Lead Successfully Allocated!</h3>
                <p className="text-sm mt-1 text-slate-300">
                  Lead for <strong className="text-white">{successData.lead.name}</strong> was created and distributed instantly.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-400">Assigned Providers:</span>
                  {successData.assignedProviders.length > 0 ? (
                    successData.assignedProviders.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded bg-emerald-900/50 border border-emerald-800/80 text-xs text-emerald-300 font-medium"
                      >
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                      None (All eligible providers are at quota capacity!)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5.5 w-5.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-white">Submission Error</h3>
                <p className="text-sm mt-1 text-rose-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Your Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9999999999"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                City / Location
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New York"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label htmlFor="serviceId" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Service Requested
              </label>
              {servicesLoading ? (
                <div className="w-full h-11 bg-slate-950 border border-slate-850 rounded-xl animate-pulse" />
              ) : (
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                >
                  {services.map((svc) => (
                    <option key={svc._id} value={svc._id}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Service Requirements
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe what help you need..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || servicesLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-4.5 w-4.5" /> Submit Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
