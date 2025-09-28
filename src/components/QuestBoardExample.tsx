'use client'

import React, { useEffect, useState } from 'react';
import GenericQuestBoard from './GenericQuestBoard';

// Example custom quests for different use cases
const WORK_QUESTS = [
  { id: "standup", title: "Attend daily standup meeting", points: 5 },
  { id: "code_review", title: "Review 2 pull requests", points: 10 },
  { id: "refactor", title: "Refactor one function or component", points: 15 },
  { id: "documentation", title: "Update project documentation", points: 8 },
  { id: "testing", title: "Write tests for new feature", points: 12 },
];

const FITNESS_QUESTS = [
  { id: "morning_walk", title: "Take a 15-minute morning walk", points: 10 },
  { id: "drink_water", title: "Drink 8 glasses of water", points: 8 },
  { id: "workout", title: "Complete 30-minute workout", points: 15 },
  { id: "healthy_meal", title: "Prepare a healthy meal", points: 12 },
  { id: "meditation", title: "Meditate for 10 minutes", points: 10 },
];

const LEARNING_QUESTS = [
  { id: "read_article", title: "Read one technical article", points: 8 },
  { id: "practice_coding", title: "Complete coding challenge", points: 15 },
  { id: "watch_tutorial", title: "Watch educational video", points: 10 },
  { id: "take_notes", title: "Take notes on new concept", points: 5 },
  { id: "build_project", title: "Work on personal project for 1 hour", points: 20 },
];

// Default productivity quests (same as the original tasking quests)
const DEFAULT_QUESTS = [
  { id: "complete_priority_task", title: "Complete your highest priority task", points: 15 },
  { id: "plan_day", title: "Plan your day with 3 specific goals", points: 10 },
  { id: "review_completed", title: "Review and celebrate completed tasks", points: 8 },
  { id: "organize_workspace", title: "Organize your workspace for 10 minutes", points: 10 },
  { id: "focus_session", title: "Complete a 25-minute focused work session", points: 12 },
  { id: "eliminate_distraction", title: "Eliminate one source of distraction", points: 8 },
  { id: "break_big_task", title: "Break down a big task into smaller steps", points: 10 },
];

function QuestBoardExample() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [workPoints, setWorkPoints] = useState(0);
  const [fitnessPoints, setFitnessPoints] = useState(0);
  const [learningPoints, setLearningPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [selectedBoard, setSelectedBoard] = useState('default');

  // Load points and streak from localStorage
  useEffect(() => {
    const updateStats = () => {
      const points = Number(localStorage.getItem('Quest_points') || 0);
      const workPts = Number(localStorage.getItem('Work_points') || 0);
      const fitnessPts = Number(localStorage.getItem('Fitness_points') || 0);
      const learningPts = Number(localStorage.getItem('Learning_points') || 0);
      const streak = Number(localStorage.getItem('Quest_streak') || 0);
      
      setTotalPoints(points);
      setWorkPoints(workPts);
      setFitnessPoints(fitnessPts);
      setLearningPoints(learningPts);
      setCurrentStreak(streak);
    };

    updateStats();

    // Listen for points updates from the quest board
    const handlePointsUpdate = () => {
      updateStats();
    };

    window.addEventListener('Quest:points:update', handlePointsUpdate);
    return () => window.removeEventListener('Quest:points:update', handlePointsUpdate);
  }, []);

  const getBoardConfig = () => {
    switch (selectedBoard) {
      case 'work':
        return {
          quests: WORK_QUESTS,
          title: 'Work Quests',
          pointsStorageKey: 'Work_points',
          streakStorageKey: 'Work_streak'
        };
      case 'fitness':
        return {
          quests: FITNESS_QUESTS,
          title: 'Fitness Quests',
          pointsStorageKey: 'Fitness_points',
          streakStorageKey: 'Fitness_streak'
        };
      case 'learning':
        return {
          quests: LEARNING_QUESTS,
          title: 'Learning Quests',
          pointsStorageKey: 'Learning_points',
          streakStorageKey: 'Learning_streak'
        };
      default:
        return {
          quests: DEFAULT_QUESTS,
          title: 'Productivity Quests',
          pointsStorageKey: 'Quest_points',
          streakStorageKey: 'Quest_streak'
        };
    }
  };

  const totalAllPoints = totalPoints + workPoints + fitnessPoints + learningPoints;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">Tasking Quest Manager</h1>
        <p className="text-gray-600 mb-8 text-center">
          Choose your quest category and start leveling up your productivity!
        </p>
        
        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {totalAllPoints}
            </div>
            <div className="text-sm text-gray-500">
              Total Points
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {currentStreak}
            </div>
            <div className="text-sm text-gray-500">
              Day Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {workPoints}
            </div>
            <div className="text-sm text-gray-500">
              Work
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {fitnessPoints}
            </div>
            <div className="text-sm text-gray-500">
              Fitness
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {learningPoints}
            </div>
            <div className="text-sm text-gray-500">
              Learning
            </div>
          </div>
        </div>

        {/* Board Selector */}
        <div className="mb-8">
          <div className="mb-4 font-semibold text-lg text-gray-900">
            Choose Quest Board:
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'default', label: 'Productivity', color: 'blue' },
              { key: 'work', label: 'Work', color: 'purple' },
              { key: 'fitness', label: 'Fitness', color: 'red' },
              { key: 'learning', label: 'Learning', color: 'yellow' }
            ].map(board => (
              <button
                key={board.key}
                onClick={() => setSelectedBoard(board.key)}
                className={`px-6 py-2 rounded-full border-2 font-semibold transition-all duration-200 ${
                  selectedBoard === board.key
                    ? `bg-${board.color}-600 text-white border-${board.color}-600 transform -translate-y-0.5`
                    : `bg-white text-${board.color}-600 border-${board.color}-600 hover:bg-${board.color}-50`
                }`}
                style={{
                  backgroundColor: selectedBoard === board.key ? 
                    (board.color === 'blue' ? '#2563eb' : 
                     board.color === 'purple' ? '#9333ea' :
                     board.color === 'red' ? '#dc2626' : '#d97706') : '#ffffff',
                  borderColor: board.color === 'blue' ? '#2563eb' : 
                              board.color === 'purple' ? '#9333ea' :
                              board.color === 'red' ? '#dc2626' : '#d97706',
                  color: selectedBoard === board.key ? '#ffffff' : 
                         (board.color === 'blue' ? '#2563eb' : 
                          board.color === 'purple' ? '#9333ea' :
                          board.color === 'red' ? '#dc2626' : '#d97706')
                }}
              >
                {board.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quest Board */}
        <GenericQuestBoard 
          {...getBoardConfig()}
          className="demo-quest-board"
          showAddCustomQuests={true}
          showResetButton={true}
          showProgress={true}
        />

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold mb-4 text-blue-900">
            🎮 How to Use the Quest Manager
          </h3>
          <div className="text-sm text-gray-700 space-y-3">
            <div>
              <strong>🎯 Choose Your Focus:</strong> Select different quest boards based on what you want to work on today
            </div>
            <div>
              <strong>✅ Complete Quests:</strong> Check off quests as you complete them to earn points
            </div>
            <div>
              <strong>🔥 Build Streaks:</strong> Complete at least one quest each day to maintain your streak
            </div>
            <div>
              <strong>➕ Add Custom Quests:</strong> Create personalized quests that match your goals
            </div>
            <div>
              <strong>📊 Track Progress:</strong> Watch your points grow across different life areas
            </div>
          </div>
        </div>

        {/* Developer Instructions */}
        <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-300">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            🛠️ For Developers
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>This example shows how to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use multiple quest boards with different storage keys</li>
              <li>Create custom quest categories</li>
              <li>Track points across different areas</li>
              <li>Listen for quest completion events</li>
              <li>Build a complete gamified productivity system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestBoardExample;
