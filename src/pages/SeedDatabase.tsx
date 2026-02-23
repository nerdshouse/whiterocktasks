import React, { useState } from 'react';
import { db, COLLECTIONS, isoToTimestamp } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { DEMO_USERS } from '../services/seedData';
import { Button } from '../components/ui/Button';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const SeedDatabase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const batch = writeBatch(db);
      let added = 0;

      for (const u of DEMO_USERS) {
        const q = query(usersRef, where('email', '==', u.email.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          const ref = doc(usersRef);
          batch.set(ref, {
            name: u.name,
            email: u.email.toLowerCase(),
            password: u.password,
            role: u.role,
            city: u.city,
            phone: u.phone,
            approved: true,
            created_at: isoToTimestamp(new Date().toISOString()),
          });
          added++;
        }
      }

      if (added > 0) {
        await batch.commit();
      }

      setMessage({
        type: 'success',
        text:
          added > 0
            ? `Seeded ${added} demo users. All passwords: password123`
            : 'All demo users already exist. Use password123 to login.',
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Seed failed. Check Firebase config and Firestore rules.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="card p-8 w-full max-w-md shadow-lg shadow-slate-200/50">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Seed Demo Users</h1>
        <p className="text-slate-600 text-sm mb-6">
          Creates test users for each role. All use password: <strong>password123</strong>
        </p>
        <div className="space-y-2 mb-6 text-sm">
          {DEMO_USERS.map((u) => (
            <div key={u.email} className="flex justify-between text-slate-600">
              <span>{u.email}</span>
              <span className="text-slate-400">{u.role}</span>
            </div>
          ))}
        </div>
        {message && (
          <div
            className={`p-3 rounded-lg mb-4 flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              {message.text}
              {message.type === 'error' && (
                <p className="mt-2 text-xs opacity-90">
                  Deploy firestore.rules in Firebase Console → Firestore → Rules
                </p>
              )}
            </div>
          </div>
        )}
        <Button onClick={handleSeed} isLoading={loading} className="w-full">
          Seed Demo Users
        </Button>
        <a
          href="#/login"
          className="block text-center text-sm text-teal-600 mt-4 hover:underline"
        >
          ← Back to Login
        </a>
      </div>
    </div>
  );
};
