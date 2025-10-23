import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const AIInsights = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested prompts
  const suggestedPrompts = [
    "Summarize my week",
    "Find blockers in my project",
    "Which modules are behind schedule?",
    "Show team performance",
    "What should I focus on next?"
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load quick summary on mount
  useEffect(() => {
    loadQuickSummary();
  }, []);

  const loadQuickSummary = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/ai/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHealthScore(data.summary.healthScore);
        
        // Add welcome message with summary
        setMessages([{
          id: Date.now(),
          type: 'assistant',
          content: `Welcome! Your project health score is **${data.summary.healthScore}/100**. Ask me anything about your projects!`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleSendMessage = async (promptText = null) => {
    const query = promptText || inputValue.trim();
    if (!query) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.insights,
        projectData: data.projectData,
        blockers: data.blockers,
        recommendations: data.recommendations,
        cached: data.cached,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      setHealthScore(data.projectData.healthScore);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();

      // Download the report
      const downloadUrl = `http://localhost:3000${data.downloadUrl}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.filename;
      link.click();

      // Add success message
      const successMessage = {
        id: Date.now(),
        type: 'system',
        content: `✅ Report generated successfully! ${data.cached ? '(Cached version)' : ''}\nHealth Score: ${data.healthScore}/100`,
        timestamp: data.timestamp
      };
      setMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Report Generation Error:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: '❌ Failed to generate report. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
                <p className="text-gray-600">Your intelligent project assistant</p>
              </div>
            </div>

            {/* Health Score Badge */}
            {healthScore !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-6 py-3 rounded-xl shadow-lg ${
                  healthScore >= 80 ? 'bg-green-500' :
                  healthScore >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              >
                <div className="text-white text-center">
                  <div className="text-sm font-medium">Health Score</div>
                  <div className="text-3xl font-bold">{healthScore}</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>{isGeneratingReport ? 'Generating...' : 'Download Weekly Report'}</span>
          </button>
        </motion.div>

        {/* Main Chat Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          
          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Try asking:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-200"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages Container */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : message.type === 'system'
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">
                          {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </p>
                      ))}
                    </div>

                    {/* Project Data */}
                    {message.projectData && (
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/50 rounded-lg p-2">
                          <div className="font-semibold">Total</div>
                          <div className="text-lg">{message.projectData.totalModules}</div>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2">
                          <div className="font-semibold">Completed</div>
                          <div className="text-lg">{message.projectData.completedModules}</div>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2">
                          <div className="font-semibold">Delayed</div>
                          <div className="text-lg">{message.projectData.delayedModules}</div>
                        </div>
                      </div>
                    )}

                    {/* Blockers */}
                    {message.blockers && message.blockers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <span className="font-semibold text-sm">Top Blockers</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {message.blockers.slice(0, 3).map((blocker, i) => (
                            <div key={i} className="bg-white/50 rounded p-2">
                              <div className="font-medium">{blocker.title}</div>
                              <div className="text-gray-600">{blocker.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp & Cached Badge */}
                    <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.cached && (
                        <span className="bg-white/30 px-2 py-0.5 rounded">Cached</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your projects..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Powered by Gemini AI • Responses are cached for 1 hour
        </motion.div>
      </div>
    </div>
  );
};

export default AIInsights;
