'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, User, Phone, Calendar, ClipboardList,
  Activity, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  COMPLETED: { label: 'Completed', icon: CheckCircle, cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, cls: 'bg-rose-500/10 text-rose-500' },
  PENDING:   { label: 'Pending',   icon: Clock,    cls: 'bg-amber-500/10 text-amber-500' },
};

export default function PatientHistoryRecords() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user, API_BASE_URL } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!id) return;

    const fetchPatient = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(res.status === 404 ? 'Patient not found.' : 'Failed to load patient data.');
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, token, user, API_BASE_URL, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 space-y-8">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader"><div></div><div></div></div>
            <p className="mt-4 text-sm font-semibold text-slate-400">Loading patient records...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {patient && (
          <>
            <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shrink-0">
                  <User className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {patient.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {patient.phoneNumber}
                    </span>
                    <span>{patient.age} yrs</span>
                    <span className="capitalize">{patient.gender}</span>
                    {patient.email && <span>{patient.email}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Medical Background / Anamnesis
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-6">
                  {patient.medicalHistory || (
                    <span className="italic text-slate-400">No medical history recorded for this patient.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-teal-600" />
                Diagnostic & Appointment Records
                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {patient.appointments?.length ?? 0} total
                </span>
              </h2>

              {!patient.appointments || patient.appointments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="mt-3 text-sm text-slate-400 font-semibold">No appointment records found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...patient.appointments]
                    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
                    .map((appt) => {
                      const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={appt.id}
                          className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${cfg.cls} shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                {new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                })}
                              </span>
                              <span className="text-slate-400 text-xs font-mono">
                                {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`ml-auto px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase ${cfg.cls}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                              {appt.reason || <span className="italic">No reason specified</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}