import React, { useState } from "react";
import { dsaQuestions, DSAQuestion, getQuestionsByDifficulty } from "@/data/dsaQuestions";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";

interface QuestionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: DSAQuestion) => void;
}

const QuestionSelectionModal: React.FC<QuestionSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedQuestion, setSelectedQuestion] = useState<DSAQuestion | null>(null);

  if (!isOpen) return null;

  const filteredQuestions = selectedDifficulty === 'All' 
    ? dsaQuestions 
    : getQuestionsByDifficulty(selectedDifficulty);

  const handleQuestionSelect = (question: DSAQuestion) => {
    setSelectedQuestion(question);
  };

  const handleSendChallenge = () => {
    if (selectedQuestion) {
      onSelectQuestion(selectedQuestion);
      onClose();
      setSelectedQuestion(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return primaryAccentColor;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative w-[90vw] max-w-4xl flex flex-col h-[80vh] rounded-lg shadow-xl border overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: isDarkMode ? "#333333" : "#e5e5e5",
          }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
          >
            Select a Coding Challenge
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70 transition-opacity"
            style={{ color: isDarkMode ? "#aaa" : "#666" }}
          >
            ×
          </button>
        </div>

        <div className="flex h-[75%]">
          {/* Left Panel - Question List */}
          <div
            className="w-1/2 border-r overflow-y-auto"
            style={{
              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
            }}
          >
            {/* Difficulty Filter */}
            <div className="p-4 border-b" style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Easy', 'Medium', 'Hard'].map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty as 'All' | 'Easy' | 'Medium' | 'Hard')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedDifficulty === difficulty
                        ? 'text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor:
                        selectedDifficulty === difficulty
                          ? difficulty === 'All'
                            ? primaryAccentColor
                            : getDifficultyColor(difficulty)
                          : 'transparent',
                      border: `1px solid ${
                        selectedDifficulty === difficulty
                          ? 'transparent'
                          : isDarkMode
                          ? '#333333'
                          : '#e5e5e5'
                      }`,
                    }}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="p-4 space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => handleQuestionSelect(question)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedQuestion?.id === question.id
                      ? 'ring-2'
                      : ''
                  }`}
                  style={{
                    backgroundColor: selectedQuestion?.id === question.id
                      ? isDarkMode ? "#2a2a2a" : "#f8f9fa"
                      : isDarkMode ? "#1e1e1e" : "#ffffff",
                    borderColor: selectedQuestion?.id === question.id
                      ? primaryAccentColor
                      : isDarkMode ? "#333333" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                    >
                      {question.title}
                    </h3>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getDifficultyColor(question.difficulty) + '20',
                        color: getDifficultyColor(question.difficulty),
                      }}
                    >
                      {question.difficulty}
                    </span>
                  </div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: isDarkMode ? "#aaa" : "#666" }}
                  >
                    {question.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs"
                      style={{ color: isDarkMode ? "#888" : "#888" }}
                    >
                      Time: {question.timeLimit} min
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: isDarkMode ? "#888" : "#888" }}
                    >
                      {question.testCases.length} test cases
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Question Preview */}
          <div className="w-1/2 overflow-y-auto">
            {selectedQuestion ? (
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                    >
                      {selectedQuestion.title}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: getDifficultyColor(selectedQuestion.difficulty) + '20',
                        color: getDifficultyColor(selectedQuestion.difficulty),
                      }}
                    >
                      {selectedQuestion.difficulty}
                    </span>
                  </div>
                  <p
                    className="text-sm mb-4"
                    style={{ color: isDarkMode ? "#aaa" : "#666" }}
                  >
                    {selectedQuestion.category} • {selectedQuestion.timeLimit} minutes
                  </p>
                </div>

                <div className="mb-6">
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                  >
                    Description
                  </h4>
                  <p
                    className="text-sm whitespace-pre-line"
                    style={{ color: isDarkMode ? "#ccc" : "#444" }}
                  >
                    {selectedQuestion.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                  >
                    Examples
                  </h4>
                  {selectedQuestion.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="mb-3 p-3 rounded border"
                      style={{
                        backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                        borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                      }}
                    >
                      <div className="mb-1">
                        <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>
                          Input:
                        </strong>
                        <code
                          className="ml-2 text-sm"
                          style={{ color: isDarkMode ? "#aaa" : "#666" }}
                        >
                          {example.input}
                        </code>
                      </div>
                      <div className="mb-1">
                        <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>
                          Output:
                        </strong>
                        <code
                          className="ml-2 text-sm"
                          style={{ color: isDarkMode ? "#aaa" : "#666" }}
                        >
                          {example.output}
                        </code>
                      </div>
                      {example.explanation && (
                        <div>
                          <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>
                            Explanation:
                          </strong>
                          <span
                            className="ml-2 text-sm"
                            style={{ color: isDarkMode ? "#aaa" : "#666" }}
                          >
                            {example.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                  >
                    Constraints
                  </h4>
                  <ul className="space-y-1">
                    {selectedQuestion.constraints.map((constraint, idx) => (
                      <li
                        key={idx}
                        className="text-sm"
                        style={{ color: isDarkMode ? "#ccc" : "#444" }}
                      >
                        • {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 h-full flex items-center justify-center">
                <p
                  className="text-center"
                  style={{ color: isDarkMode ? "#888" : "#666" }}
                >
                  Select a question from the list to preview it here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex justify-end gap-3"
          style={{
            borderColor: isDarkMode ? "#333333" : "#e5e5e5",
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: isDarkMode ? "#aaa" : "#666",
              border: `1px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSendChallenge}
            disabled={!selectedQuestion}
            className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedQuestion ? primaryAccentColor : isDarkMode ? "#333" : "#ddd",
              color: selectedQuestion ? (isDarkMode ? "#000" : "#fff") : (isDarkMode ? "#666" : "#999"),
            }}
          >
            Send Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionModal; 