import React, { useState, useEffect, useRef } from "react";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useSocket } from "@/context/SocketContext";
import { DSAQuestion, TestCase } from "@/data/dsaQuestions";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
});

interface CodingChallengeInterfaceProps {
  question: DSAQuestion;
  roomId: string;
  role: 'challenger' | 'accepter';
  opponent: {
    socketId: string;
    userId: string;
  };
  onClose: () => void;
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
}

const CodingChallengeInterface: React.FC<CodingChallengeInterfaceProps> = ({
  question,
  roomId,
  opponent,
  onClose,
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const { socket } = useSocket();
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp'>('javascript');
  const [code, setCode] = useState(question.starterCode[selectedLanguage]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(question.timeLimit * 60); // Convert minutes to seconds
  const [challengeStatus, setChallengeStatus] = useState<'active' | 'completed' | 'timeout' | 'surrendered'>('active');
  const [opponentProgress, setOpponentProgress] = useState({ testsPassed: 0, totalTests: question.testCases.length });
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (challengeStatus !== 'active') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setChallengeStatus('timeout');
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [challengeStatus]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleOpponentProgress = (data: { testsPassed: number; totalTests: number }) => {
      setOpponentProgress(data);
    };

    const handleOpponentCompleted = (data: { winner: string; completionTime: number; pointsAwarded?: number }) => {
      setChallengeStatus('completed');
      if (data.winner === opponent.socketId) {
        toast.error("Your opponent completed the challenge first!");
      } else if (data.pointsAwarded) {
        setPointsAwarded(data.pointsAwarded);
        toast.success(`Congratulations! You earned ${data.pointsAwarded} points!`);
      }
    };

    const handleChallengeTimeout = () => {
      setChallengeStatus('timeout');
      toast.error("Time's up!");
    };

    const handleChallengeSurrender = (data: { surrenderSocketId: string; surrenderPenalty: number; opponentReward: number }) => {
      if (data.surrenderSocketId === socket.id) {
        setChallengeStatus('surrendered');
        toast.error(`You surrendered and lost ${Math.abs(data.surrenderPenalty)} points.`);
      } else {
        setChallengeStatus('completed');
        toast.success(`Your opponent surrendered! You earned ${data.opponentReward} points.`);
      }
    };

    socket.on("opponentProgress", handleOpponentProgress);
    socket.on("challengeCompleted", handleOpponentCompleted);
    socket.on("challengeTimeout", handleChallengeTimeout);
    socket.on("challengeSurrender", handleChallengeSurrender);

    return () => {
      socket.off("opponentProgress", handleOpponentProgress);
      socket.off("challengeCompleted", handleOpponentCompleted);
      socket.off("challengeTimeout", handleChallengeTimeout);
      socket.off("challengeSurrender", handleChallengeSurrender);
    };
  }, [socket, opponent.socketId]);

  // Update code when language changes
  useEffect(() => {
    setCode(question.starterCode[selectedLanguage]);
  }, [selectedLanguage, question.starterCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageId = (language: string) => {
    const languageMap: { [key: string]: number } = {
      javascript: 93, // Node.js
      python: 92,     // Python 3
      java: 91,       // Java 17
      cpp: 76,        // C++ 17
    };
    return languageMap[language] || 93;
  };
  function generateFinalSourceCode(language: string, userCode: string, testInput: string): string {
    const [input1, input2] = testInput.trim().split('\n');
  
    switch (language) {
      case 'python':
        return `${userCode}\nprint(two_sum(${input1}, ${input2}))`;
  
      case 'javascript':
        return `${userCode}\nconsole.log(twoSum(${input1}, ${input2}));`;
  
      case 'java':
        return `${userCode}
  public class Main {
    public static void main(String[] args) {
      int[] nums = new int[] ${input1};
      int target = ${input2};
      int[] result = twoSum(nums, target);
      for (int i : result) System.out.print(i + " ");
    }
  }
  `;
  
      case 'cpp':
        return `#include <iostream>
  using namespace std;
  ${userCode}
  int main() {
      vector<int> result = twoSum(${input1}, ${input2});
      for (int i : result) cout << i << " ";
      return 0;
  }
  `;
  
      default:
        return userCode;
    }
  }
  

  const executeBatchCode = async (testCases: TestCase[]): Promise<TestResult[]> => {
      
      try {
      // Create batch submission with all test cases
      const batchSubmissions = testCases.map((testCase) => ({
        source_code: generateFinalSourceCode(selectedLanguage, code, testCase.input),
        language_id: getLanguageId(selectedLanguage),
        stdin: testCase.input,
        expected_output: testCase.expectedOutput,
        cpu_time_limit: 5, // 5 seconds per test case
        memory_limit: 512000, // 512MB
      }));

      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_JUDGE0_API_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          submissions: batchSubmissions
        })
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const batchSubmission = await response.json();
      console.log('Batch submission response:', batchSubmission);
      
      // Extract tokens from the array response
      const tokens = Array.isArray(batchSubmission) 
        ? batchSubmission.map((s: { token: string }) => s.token)
        : batchSubmission.tokens || batchSubmission.submissions?.map((s: { token: string }) => s.token) || [];
      
      if (!tokens || tokens.length === 0) {
        throw new Error('Failed to create batch submission - no tokens received');
      }

      // Poll for batch results
      let batchResult;
      let attempts = 0;
      const maxAttempts = 15; // Increased for batch processing

      do {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Slightly longer wait for batch
        const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/batch?tokens=${tokens.join(',')}`, {
          headers: {
            'X-RapidAPI-Key': process.env.NEXT_PUBLIC_JUDGE0_API_KEY || '',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        });
        batchResult = await resultResponse.json();
        attempts++;
      } while (batchResult.submissions?.some((s: { status?: { id: number } }) => (s.status?.id ?? 0) <= 2) && attempts < maxAttempts);

      // Process results
      const results: TestResult[] = [];
      for (let i = 0; i < testCases.length; i++) {
        const submission = batchResult.submissions[i];
        const testCase = testCases[i];
        
        let actualOutput = '';
        let error = undefined;
        let passed = false;

        if (submission.compile_output) {
          error = submission.compile_output;
        } else if (submission.stderr) {
          error = submission.stderr;
        } else if (submission.stdout) {
          actualOutput = submission.stdout.replace(/\s/g, '').trim();
          passed = actualOutput === testCase.expectedOutput.replace(/\s/g, '').trim();
        } else if (submission.status?.id === 3) {
          // Time limit exceeded
          error = 'Time limit exceeded';
        } else if (submission.status?.id === 4) {
          // Memory limit exceeded
          error = 'Memory limit exceeded';
        } else if (submission.status?.id === 5) {
          // Runtime error
          error = 'Runtime error';
        } else {
          error = 'Execution failed';
        }

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          passed,
          error
        });
      }

      return results;
    } catch (error) {
      console.error('Batch execution failed:', error);
      // Fallback to individual submissions if batch fails
      return await executeIndividualTests(testCases);
    }
  };

  const executeIndividualTests = async (testCases: TestCase[]): Promise<TestResult[]> => {
    console.log('Falling back to individual test execution');
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      try {
        console.log('Executing test case:', testCase.input);
        const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.NEXT_PUBLIC_JUDGE0_API_KEY || '',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          },
          body: JSON.stringify({
            source_code: generateFinalSourceCode(selectedLanguage, code, testCase.input),
            language_id: getLanguageId(selectedLanguage),
            stdin: testCase.input,
            cpu_time_limit: 5,
            memory_limit: 512000,
          })
        });

        const submission = await response.json();
        console.log('Individual submission response:', submission);
        
        // Poll for result
        let result;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${submission.token}`, {
            headers: {
              'X-RapidAPI-Key': process.env.NEXT_PUBLIC_JUDGE0_API_KEY || '',
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
          });
          result = await resultResponse.json();
          attempts++;
        } while (result.status && result.status.id <= 2 && attempts < maxAttempts);

        let actualOutput = '';
        let error = undefined;
        let passed = false;

        if (result.compile_output) {
          error = result.compile_output;
        } else if (result.stderr) {
          error = result.stderr;
        } else if (result.stdout) {
          actualOutput = result.stdout.replace(/\s/g, '').trim();
          passed = actualOutput === testCase.expectedOutput.replace(/\s/g, '').trim();
        } else {
          error = 'Execution failed';
        }

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          passed,
          error
        });
      } catch {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: 'Execution failed'
        });
      }
    }

    return results;
  };
  



  const handleRunTests = async () => {
    if (challengeStatus !== 'active') return;
    
    setIsRunning(true);

    try {
      // Use batch submission for better performance
      const results = await executeBatchCode(question.testCases);
      
      setTestResults(results);
      const passedTests = results.filter(r => r.passed).length;
      
      // Emit progress to opponent
      socket?.emit("challengeProgress", {
        roomId,
        testsPassed: passedTests,
        totalTests: results.length
      });

      toast.success(`${passedTests}/${results.length} test cases passed`);
    } catch (error) {
      console.error('Test execution failed:', error);
      toast.error("Failed to run tests");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (challengeStatus !== 'active') return;
    
    setIsSubmitting(true);
    
    try {
      // Run tests and get the fresh results directly
      const results = await executeBatchCode(question.testCases);
      
      setTestResults(results);
      const passedTests = results.filter(r => r.passed).length;
      
      // Emit progress to opponent
      socket?.emit("challengeProgress", {
        roomId,
        testsPassed: passedTests,
        totalTests: results.length
      });

      const allTestsPassed = passedTests === question.testCases.length;
      
      if (allTestsPassed) {
        const completionTime = question.timeLimit * 60 - timeLeft;
        setChallengeStatus('completed');
        
        socket?.emit("challengeCompleted", {
          roomId,
          winner: socket.id,
          completionTime,
          testsPassed: passedTests,
          totalTests: question.testCases.length
        });
        
        toast.success("Congratulations! You solved the challenge!");
      } else {
        toast.error(`${passedTests}/${question.testCases.length} test cases passed. Fix the remaining issues.`);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error("Failed to submit solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeout = () => {
    socket?.emit("challengeTimeout", { roomId });
    toast.error("Time's up! Challenge ended.");
  };

  const handleSurrender = () => {
    if (!socket) return;
    
    socket.emit("challengeSurrender", {
      roomId,
      opponentSocketId: opponent.socketId
    });
    
    setShowSurrenderModal(false);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (challengeStatus === 'active') {
      setShowSurrenderModal(true);
    } else {
      onClose();
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="w-[95vw] h-[95vh] rounded-lg shadow-xl border overflow-hidden flex flex-col"
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold" style={{ color: isDarkMode ? "#fff" : "#000" }}>
              {question.title}
            </h2>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: getDifficultyColor(question.difficulty) + '20',
                color: getDifficultyColor(question.difficulty),
              }}
            >
              {question.difficulty}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div
              className={`px-3 py-1 rounded-lg font-mono text-lg font-bold ${
                timeLeft < 60 ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: timeLeft < 60 ? '#ef4444' : primaryAccentColor,
                color: '#fff'
              }}
            >
              {formatTime(timeLeft)}
            </div>
            
            {/* Opponent Progress */}
            <div className="text-sm" style={{ color: isDarkMode ? "#aaa" : "#666" }}>
              Opponent: {opponentProgress.testsPassed}/{opponentProgress.totalTests} tests
            </div>
            
            <button
              onClick={handleCloseAttempt}
              className="text-2xl font-bold hover:opacity-70"
              style={{ color: isDarkMode ? "#aaa" : "#666" }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Problem Description */}
          <div
            className="w-1/2 border-r overflow-y-auto"
            style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}
          >
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Problem Description
                </h3>
                <p className="text-sm whitespace-pre-line" style={{ color: isDarkMode ? "#ccc" : "#444" }}>
                  {question.description}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Examples
                </h4>
                {question.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="mb-4 p-3 rounded border"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                    }}
                  >
                    <div className="mb-2">
                      <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>Input:</strong>
                      <code className="ml-2 text-sm" style={{ color: isDarkMode ? "#aaa" : "#666" }}>
                        {example.input}
                      </code>
                    </div>
                    <div className="mb-2">
                      <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>Output:</strong>
                      <code className="ml-2 text-sm" style={{ color: isDarkMode ? "#aaa" : "#666" }}>
                        {example.output}
                      </code>
                    </div>
                    {example.explanation && (
                      <div>
                        <strong style={{ color: isDarkMode ? "#fff" : "#000" }}>Explanation:</strong>
                        <span className="ml-2 text-sm" style={{ color: isDarkMode ? "#aaa" : "#666" }}>
                          {example.explanation}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Constraints
                </h4>
                <ul className="space-y-1">
                  {question.constraints.map((constraint, idx) => (
                    <li key={idx} className="text-sm" style={{ color: isDarkMode ? "#ccc" : "#444" }}>
                      • {constraint}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Points Awarded Display */}
              {pointsAwarded && challengeStatus === 'completed' && (
                <div className="mb-6 p-4 rounded-lg border" style={{
                  backgroundColor: isDarkMode ? "#1e3a2e" : "#f0f9f0",
                  borderColor: "#22c55e"
                }}>
                  <h4 className="font-semibold mb-2 text-green-600">Challenge Completed!</h4>
                  <p className="text-sm" style={{ color: isDarkMode ? "#ccc" : "#444" }}>
                    You earned <span className="font-bold text-green-600">{pointsAwarded} points</span> for completing this challenge!
                  </p>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                    Test Results ({testResults.filter(r => r.passed).length}/{testResults.length} passed)
                  </h4>
                  <div className="space-y-2">
                    {testResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border text-xs"
                        style={{
                          backgroundColor: result.passed 
                            ? (isDarkMode ? "#1e3a2e" : "#f0f9f0")
                            : (isDarkMode ? "#3a1e1e" : "#f9f0f0"),
                          borderColor: result.passed ? "#22c55e" : "#ef4444",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: result.passed ? "#22c55e" : "#ef4444" }}>
                            {result.passed ? "✓" : "✗"} Test {idx + 1}
                          </span>
                        </div>
                        {result.error && (
                          <div style={{ color: "#ef4444" }}>Error: {result.error}</div>
                        )}
                        {!result.passed && !result.error && (
                          <div>
                            <div>Expected: {result.expectedOutput}</div>
                            <div>Got: {result.actualOutput}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="w-1/2 flex flex-col">
            {/* Language Selector and Actions */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}
            >
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as 'javascript' | 'python' | 'java' | 'cpp')}
                className="px-3 py-1 rounded border"
                style={{
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                  borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleRunTests}
                  disabled={isRunning || challengeStatus !== 'active'}
                  className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: isDarkMode ? "#333" : "#ddd",
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  {isRunning ? "Running..." : "Run Tests"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || challengeStatus !== 'active'}
                  className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: primaryAccentColor,
                    color: isDarkMode ? "#000" : "#fff",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                theme={isDarkMode ? "vs-dark" : "light"}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={(editor) => {
                    editor.onKeyDown((e) => {
                      e.stopPropagation();
                    });
                  }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Surrender Confirmation Modal */}
      {showSurrenderModal && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            style={{
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: isDarkMode ? "#fff" : "#000" }}>
              Surrender Challenge?
            </h3>
            <p className="text-sm mb-6" style={{ color: isDarkMode ? "#ccc" : "#444" }}>
              Are you sure you want to surrender this coding challenge? You will lose <span className="font-bold text-red-500">50 points</span> and your opponent will earn <span className="font-bold text-green-500">25 points</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSurrenderModal(false)}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                Continue Fighting
              </button>
              <button
                onClick={handleSurrender}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Surrender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingChallengeInterface; 