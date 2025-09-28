'use client'

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import GenericQuestBoard from './GenericQuestBoard';

interface Task {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  userId: string;
  userName: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
  partnerName?: string;
  whatsappNumber?: string;
}

function AccountabilityPartner() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [partnerTasks, setPartnerTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await createOrUpdateUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to partner's tasks
  useEffect(() => {
    if (userProfile?.partnerId) {
      const tasksRef = collection(db, 'tasks');
      const partnerTasksQuery = query(
        tasksRef, 
        where('userId', '==', userProfile.partnerId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(partnerTasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
        })) as Task[];
        setPartnerTasks(tasks);
      });

      return () => unsubscribe();
    }
  }, [userProfile?.partnerId]);

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        setUserProfile({ id: user.uid, ...userSnap.data() } as UserProfile);
      } else {
        const newProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
        };
        await setDoc(userDoc, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const connectPartner = async () => {
    if (!partnerEmail || !user) return;

    try {
      // Find partner by email
      const usersRef = collection(db, 'users');
      const partnerQuery = query(usersRef, where('email', '==', partnerEmail));
      const partnerSnap = await getDocs(partnerQuery);

      if (partnerSnap.empty) {
        alert('Partner not found. Make sure they have signed up first.');
        return;
      }

      const partnerDoc = partnerSnap.docs[0];
      const partnerData = partnerDoc.data();

      // Update current user's profile
      await updateDoc(doc(db, 'users', user.uid), {
        partnerId: partnerDoc.id,
        partnerName: partnerData.name,
        whatsappNumber: whatsappNumber || null
      });

      // Update partner's profile
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        partnerId: user.uid,
        partnerName: user.displayName || 'Anonymous'
      });

      alert('Successfully connected with your accountability partner!');
      
      // Refresh user profile
      await createOrUpdateUserProfile(user);
    } catch (error) {
      console.error('Error connecting partner:', error);
      alert('Error connecting partner. Please try again.');
    }
  };

  const handleTaskComplete = async (taskData: { title: string; points: number }) => {
    if (!user || !userProfile) return;

    try {
      // Save task to Firestore
      const task: Omit<Task, 'id'> = {
        title: taskData.title,
        points: taskData.points,
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
        userId: user.uid,
        userName: userProfile.name
      };

      await addDoc(collection(db, 'tasks'), task);

      // Send WhatsApp notification (if configured)
      if (userProfile.partnerId && userProfile.partnerName) {
        await sendWhatsAppNotification({
          type: 'task_completed',
          userName: userProfile.name,
          taskTitle: taskData.title,
          points: taskData.points,
          partnerId: userProfile.partnerId
        });
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const sendWhatsAppNotification = async (data: {
    type: string;
    userName: string;
    taskTitle: string;
    points: number;
    partnerId: string;
  }) => {
    try {
      // This will call your WhatsApp backend service
      await fetch('/api/whatsapp-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-[var(--text-primary)] text-xl font-[var(--font-tanker)]">
          Loading your accountability journey...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-4 border-[var(--secondary)]" 
             style={{ boxShadow: '0 4px 0 var(--color-green-900), 0 8px 24px var(--color-green-900-20)' }}>
          <div className="text-center">
            <h1 className="text-3xl font-[var(--font-tanker)] text-[var(--text-primary)] mb-4">
              🤝 Accountability Partners
            </h1>
            <p className="text-[var(--text-primary)] mb-8">
              Sign in to start your accountability journey with a friend!
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--color-lime-300)] 
                         text-[var(--secondary)] font-bold py-3 px-6 rounded-full border-3 border-[var(--secondary)]
                         transition-all duration-300 hover:transform hover:-translate-y-1"
              style={{ 
                boxShadow: '0 4px 0 var(--color-green-900), 0 8px 16px var(--color-green-900-20)',
                border: '3px solid var(--color-green-900)'
              }}
            >
              🚀 Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-[var(--font-tanker)] text-[var(--text-primary)] mb-2">
              🤝 Accountability Partners
            </h1>
            <p className="text-[var(--text-primary)] opacity-80">
              Welcome, {userProfile?.name}! {userProfile?.partnerName ? `Connected with ${userProfile.partnerName} 💚` : 'Connect with a partner to get started'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-[var(--text-primary)] border-2 border-[var(--secondary)] 
                       rounded-lg hover:bg-[var(--color-cream)] transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Partner Connection */}
        {!userProfile?.partnerId && (
          <div className="bg-white rounded-2xl p-6 mb-8 border-4 border-[var(--secondary)]"
               style={{ boxShadow: '0 4px 0 var(--color-green-900), 0 8px 24px var(--color-green-900-20)' }}>
            <h2 className="text-2xl font-[var(--font-tanker)] text-[var(--text-primary)] mb-4">
              🔗 Connect with Your Partner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Partner's email address"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="quest-input"
              />
              <input
                type="tel"
                placeholder="Your WhatsApp number (optional)"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="quest-input"
              />
            </div>
            <button
              onClick={connectPartner}
              className="quest-btn quest-btn-primary mt-4"
              disabled={!partnerEmail}
            >
              🤝 Connect Partner
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Tasks */}
          <div>
            <h2 className="text-2xl font-[var(--font-tanker)] text-[var(--text-primary)] mb-4">
              📝 Your Daily Tasks
            </h2>
            <GenericQuestBoard
              title="Today's Goals"
              pointsStorageKey={`user_${user.uid}_points`}
              streakStorageKey={`user_${user.uid}_streak`}
              showAddCustomQuests={true}
              showResetButton={true}
              showProgress={true}
              onTaskComplete={handleTaskComplete}
            />
          </div>

          {/* Partner's Tasks */}
          <div>
            <h2 className="text-2xl font-[var(--font-tanker)] text-[var(--text-primary)] mb-4">
              👥 {userProfile?.partnerName || "Partner&apos;s"} Progress
            </h2>
            {userProfile?.partnerId ? (
              <div className="quest-board-container">
                <div className="quest-board">
                  <div className="quest-board-header">
                    <div className="quest-board-title">
                      <h2>{userProfile.partnerName}&apos;s Tasks</h2>
                    </div>
                  </div>
                  
                  {partnerTasks.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-primary)] opacity-70">
                      <p>No tasks completed yet today</p>
                      <p className="text-sm mt-2">Encourage your partner to get started! 💪</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {partnerTasks.map((task) => (
                        <div key={task.id} className="quest-item quest-item-completed">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                              <span className="text-[var(--secondary)] text-xs">✓</span>
                            </div>
                            <div className="flex-1">
                              <div className="quest-title">{task.title}</div>
                              <div className="text-xs text-[var(--text-primary)] opacity-70">
                                Completed {task.completedAt?.toLocaleTimeString() || 'recently'}
                              </div>
                            </div>
                          </div>
                          <div className="quest-points">+{task.points}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="quest-board-container">
                <div className="quest-board text-center py-8">
                  <p className="text-[var(--text-primary)] opacity-70">
                    Connect with a partner to see their progress here! 🤝
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountabilityPartner;
