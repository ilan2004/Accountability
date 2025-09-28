"use client";

import { useEffect, useMemo, useState } from "react";

// Type definitions
interface Quest {
  id: string;
  title: string;
  points: number;
}

interface GenericQuestBoardProps {
  quests?: Quest[];
  title?: string;
  pointsStorageKey?: string;
  streakStorageKey?: string;
  className?: string;
  showAddCustomQuests?: boolean;
  showResetButton?: boolean;
  showProgress?: boolean;
  onTaskComplete?: (taskData: { title: string; points: number }) => void;
}

// Default quests that work for everyone
const DEFAULT_QUESTS = [
  { id: "daily_focus_25", title: "Complete one 25m focus block", points: 10 },
  { id: "no_social_hour", title: "Avoid social media for 1 hour", points: 8 },
  { id: "write_intent", title: "Write a one-line session intent", points: 5 },
  { id: "organize_space", title: "Organize your workspace for 10 minutes", points: 10 },
  { id: "complete_task", title: "Finish one task you've been putting off", points: 12 },
  { id: "plan_tomorrow", title: "Plan tomorrow's schedule", points: 8 },
];

function todayKey() {
  try {
    // Local-date in YYYY-MM-DD
    return new Date().toLocaleDateString("en-CA");
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function loadDayState(key: string) {
  try {
    const raw = localStorage.getItem(`Quest_state_${key}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDayState(key: string, state: {[key: string]: boolean}) {
  try {
    localStorage.setItem(`Quest_state_${key}`, JSON.stringify(state));
  } catch {}
}

function getNumber(key: string, def = 0) {
  try {
    return Number(localStorage.getItem(key)) || def;
  } catch {
    return def;
  }
}

function setNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function dispatchPointsUpdate() {
  try {
    window.dispatchEvent(new Event("Quest:points:update"));
  } catch {}
}

export default function GenericQuestBoard({ 
  quests = DEFAULT_QUESTS,
  title = "Daily Quests",
  pointsStorageKey = "Quest_points",
  streakStorageKey = "Quest_streak",
  className = "",
  showAddCustomQuests = true,
  showResetButton = true,
  showProgress = true,
  onTaskComplete
}: GenericQuestBoardProps) {
  const [day, setDay] = useState(todayKey());
  const [state, setState] = useState<{[key: string]: boolean}>({}); // { [questId]: boolean }
  const [customQuests, setCustomQuests] = useState<Quest[]>([]); // array of { id, title, points }
  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState(5);

  // Load today's state on mount and when day changes
  useEffect(() => {
    const key = todayKey();
    setDay(key);
    setState(loadDayState(key));
    // load custom quests for the day
    try {
      const raw = localStorage.getItem(`Quest_custom_${key}`);
      setCustomQuests(raw ? JSON.parse(raw) : []);
    } catch {
      setCustomQuests([]);
    }
  }, []);

  // If the actual day changes while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      const key = todayKey();
      if (key !== day) {
        setDay(key);
        setState(loadDayState(key));
        try {
          const raw = localStorage.getItem(`Quest_custom_${key}`);
          setCustomQuests(raw ? JSON.parse(raw) : []);
        } catch {
          setCustomQuests([]);
        }
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [day]);

  const allQuests = useMemo(() => [...quests, ...customQuests], [quests, customQuests]);
  const completedCount = useMemo(
    () => allQuests.filter((q) => !!state[q.id]).length,
    [state, allQuests]
  );
  const progress = Math.round((completedCount / Math.max(1, allQuests.length)) * 100);

  const toggleQuest = (quest: Quest) => {
    const key = day;
    const prev = !!state[quest.id];
    const next = !prev;

    // Persist quest state
    const nextState = { ...state, [quest.id]: next };
    setState(nextState);
    saveDayState(key, nextState);

    // Update points based on transition
    let points = getNumber(pointsStorageKey, 0);
    if (next && !prev) points += quest.points;
    if (!next && prev) points = Math.max(0, points - quest.points);
    setNumber(pointsStorageKey, points);

    // Update streak if this is the first completion of the day
    if (next && !prev) maybeUpdateStreakOnFirstCompletionOfDay(key);

    // Call onTaskComplete callback if provided and task is being completed
    if (next && !prev && onTaskComplete) {
      onTaskComplete({ title: quest.title, points: quest.points });
    }

    dispatchPointsUpdate();
  };

  const saveCustomQuests = (key: string, list: Quest[]) => {
    try {
      localStorage.setItem(`Quest_custom_${key}`, JSON.stringify(list));
    } catch {}
  };

  const addCustomQuest = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const titleValue = newTitle.trim();
    const pts = Math.max(1, Math.min(1000, Number(newPoints) || 1));
    if (!titleValue) return;
    const id = `custom_${Date.now()}`;
    const q = { id, title: titleValue, points: pts };
    const next = [...customQuests, q];
    setCustomQuests(next);
    saveCustomQuests(day, next);
    setNewTitle("");
    setNewPoints(5);
  };

  const resetToday = () => {
    const key = day;
    // Calculate points to subtract for any completed quests
    const questsCompleted = allQuests.filter((q) => !!state[q.id]);
    let points = getNumber(pointsStorageKey, 0);
    for (const q of questsCompleted) {
      points = Math.max(0, points - (Number(q.points) || 0));
    }
    setNumber(pointsStorageKey, points);

    // Clear completion state for the day
    const cleared = {};
    setState(cleared);
    saveDayState(key, cleared);

    // Allow streak to re-trigger by clearing the first-completion flag
    try { localStorage.removeItem(`Quest_completed_any_${key}`); } catch {}

    dispatchPointsUpdate();
  };

  const maybeUpdateStreakOnFirstCompletionOfDay = (today: string) => {
    // Guard: only once per day
    const flagKey = `Quest_completed_any_${today}`;
    try {
      if (localStorage.getItem(flagKey)) return;
      localStorage.setItem(flagKey, "1");
    } catch {
      // continue; streak update still safe
    }

    const last = (() => {
      try {
        return localStorage.getItem("Quest_last_active_date") || "";
      } catch {
        return "";
      }
    })();

    const currentStreak = getNumber(streakStorageKey, 0);

    const prevDate = last;
    const todayDate = today;
    const yesterday = computeRelativeDate(todayDate, -1);

    let nextStreak = currentStreak;
    if (!prevDate) {
      nextStreak = 1;
    } else if (prevDate === todayDate) {
      // already active today, keep streak
      nextStreak = currentStreak || 1;
    } else if (prevDate === yesterday) {
      nextStreak = currentStreak + 1;
    } else {
      nextStreak = 1; // reset
    }

    setNumber(streakStorageKey, nextStreak);
    try { localStorage.setItem("Quest_last_active_date", todayDate); } catch {}
  };

  return (
    <div className={`quest-board-container ${className}`}>
      <div className="quest-board">
        <div className="quest-board-header">
          <div className="quest-board-title">
            <h2>{title}</h2>
          </div>
          <div className="quest-board-date">{day}</div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {completedCount}/{allQuests.length} completed • {progress}%
            </div>
          </>
        )}

        {/* Add custom quest */}
        {showAddCustomQuests && (
          <form onSubmit={addCustomQuest} className="add-quest-form">
            <div className="form-row">
              <div className="form-group">
                <label>Quest title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Plan tomorrow in 5 minutes"
                  className="quest-input"
                />
              </div>
              <div className="form-group form-group-small">
                <label>Points</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="quest-input"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="quest-btn quest-btn-primary">
                Add Quest
              </button>
              {showResetButton && (
                <button type="button" onClick={resetToday} className="quest-btn quest-btn-secondary">
                  Reset Today
                </button>
              )}
            </div>
          </form>
        )}

        {/* Quests List */}
        <ul className="quest-list">
          {allQuests.map((q) => {
            const done = !!state[q.id];
            return (
              <li
                key={q.id}
                className={`quest-item ${done ? 'quest-item-completed' : ''}`}
              >
                <label className="quest-label">
                  <input
                    type="checkbox"
                    className="quest-checkbox"
                    checked={done}
                    onChange={() => toggleQuest(q)}
                  />
                  <span className={`quest-title ${done ? 'quest-title-completed' : ''}`}>
                    {q.title}
                  </span>
                  {done && (
                    <span className="quest-check-icon" aria-hidden>
                      ✓
                    </span>
                  )}
                </label>
                <div className="quest-points">
                  +{q.points}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function computeRelativeDate(baseYYYYMMDD: string, deltaDays: number) {
  try {
    const [y, m, d] = baseYYYYMMDD.split("-").map((n) => parseInt(n, 10));
    const dt = new Date(y, (m - 1), d);
    dt.setDate(dt.getDate() + deltaDays);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toLocaleDateString("en-CA");
  } catch {
    const dt = new Date();
    dt.setDate(dt.getDate() + deltaDays);
    return dt.toISOString().slice(0, 10);
  }
}
