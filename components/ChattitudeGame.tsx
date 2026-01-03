import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Info, Users, Sparkles, Trophy } from 'lucide-react';
import { useMultiplayerRoom } from '../hooks/useMultiplayerRoom';

const ChattitudeGame = () => {
  const [view, setView] = useState('intro');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [thesis, setThesis] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [messages, setMessages] = useState<any[]>([]);
  const [dialogQuality, setDialogQuality] = useState(100);
  const [currentInput, setCurrentInput] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState({
    player1: { constructive: 0, destructive: 0 },
    player2: { constructive: 0, destructive: 0 }
  });
  const [isDemo, setIsDemo] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [showTechniquesModal, setShowTechniquesModal] = useState(false);

  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const { roomData, isConnected, createRoom, joinRoom, sendMessage: sendMultiplayerMessage } = useMultiplayerRoom(roomIdInput || null);

  // Demo conversation data
  const demoConversation = [
    { player: "Cathy", text: "You've said men need to sort themselves out and organize. How does that help women?", playerNum: 2 },
    { player: "Jordan", text: "I'm saying society works better when people take responsibility. That applies to everyone.", playerNum: 1 },
    { player: "Cathy", text: "But you mostly talk about men. Why should women accept your message?", playerNum: 2 },
    { player: "Jordan", text: "I'm not saying they should 'accept' it. I'm saying the claim that the gender pay gap is solely due to gender is wrong.", playerNum: 1 },
    { player: "Cathy", text: "So you're saying women aren't discriminated against in the workplace?", playerNum: 2 },
    { player: "Jordan", text: "No, I'm not saying that. There are multiple factors. Education, occupation, hours worked, personality.", playerNum: 1 },
    { player: "Cathy", text: "But the outcome is that women earn less. That's a fact.", playerNum: 2 },
    { player: "Jordan", text: "Yes, but saying it's ONLY due to discrimination is oversimplified. We need to look at all variables.", playerNum: 1 },
    { player: "Cathy", text: "Why would women choose lower-paid jobs if they have the same opportunities?", playerNum: 2 },
    { player: "Jordan", text: "That's a good question. Research shows that in countries with more gender equality, differences in career choices become larger, not smaller. It's called the 'gender equality paradox'.", playerNum: 1 },
    { player: "Cathy", text: "But isn't that proof the system is rigged?", playerNum: 2 },
    { player: "Jordan", text: "Or it shows that men and women on average have different interests when they have freedom to choose. That doesn't mean everyone is the same.", playerNum: 1 }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      if (roomId) {
        setRoomIdInput(roomId);
        setIsMultiplayer(true);
        setView('join');
      }
    }
  }, []);

  useEffect(() => {
    if (roomData && isMultiplayer) {
      setMessages(roomData.messages || []);
      setDialogQuality(roomData.dialogQuality);
      setPlayerStats(roomData.playerStats);
      setCurrentPlayer(roomData.currentPlayer);
      setThesis(roomData.thesis);
      setPlayer1Name(roomData.player1Name);
      if (roomData.player2Name) {
        setPlayer2Name(roomData.player2Name);
      }
      
      // Auto-start game when both players are ready
      if (roomData?.player2Name && (view === 'waiting' || view === 'join')) {
        setView('game');
      }
    }
  }, [roomData, isMultiplayer]);

  const startDemo = async () => {
    setIsDemo(true);
    setPlayer1Name('Jordan');
    setPlayer2Name('Cathy');
    setThesis('The gender pay gap is primarily due to gender discrimination');
    setView('game');
    setDemoIndex(0);
    playNextDemoMessage(0, []);
  };

  const startMultiplayer = () => {
    setIsMultiplayer(true);
    setView('create');
  };

  const createMultiplayerRoom = async () => {
    if (!player1Name.trim() || !thesis.trim()) return;
    const newRoomId = await createRoom(thesis, player1Name);
    setRoomIdInput(newRoomId);
    localStorage.setItem('myPlayerNumber', '1');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/?room=${newRoomId}`;
    setView('waiting');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    }
  };

  const joinMultiplayerRoom = async () => {
    if (!player2Name.trim() || !roomIdInput) return;
    await joinRoom(roomIdInput, player2Name);
    localStorage.setItem('myPlayerNumber', '2');
    setView('game');
  };

  const handleMultiplayerMessage = async () => {
    if (!currentInput.trim() || analyzing || !roomIdInput) return;
    setAnalyzing(true);
    const context = messages.length > 0 ? messages.slice(-2).map(m => `${m.player}: ${m.text}`).join('\n') : 'This is the first message.';
    const analysis = await analyzeWithAI(currentInput, context);
    const playerNum = parseInt(localStorage.getItem('myPlayerNumber') || '1');
    const playerName = playerNum === 1 ? player1Name : player2Name;
    await sendMultiplayerMessage(roomIdInput, playerNum, playerName, currentInput, analysis);
    setCurrentInput('');
    setAnalyzing(false);
  };

  const playNextDemoMessage = async (index: number, currentMessages: any[]) => {
    if (index >= demoConversation.length) {
      setIsDemo(false);
      return;
    }
    const demoMsg = demoConversation[index];
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const context = currentMessages.length > 0 ? currentMessages.slice(-2).map(m => `${m.player}: ${m.text}`).join('\n') : 'This is the first message.';
    const analysis = await analyzeWithAI(demoMsg.text, context);
    const newMessage = {
      player: demoMsg.player,
      playerNum: demoMsg.playerNum,
      text: demoMsg.text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      analysis: analysis
    };
    let newQuality = dialogQuality;
    const playerKey = demoMsg.playerNum === 1 ? 'player1' : 'player2' as 'player1' | 'player2';
    let newStats = { ...playerStats };
    if (analysis.category === 'dirty_trick' && analysis.confidence >= 75) {
      newQuality = Math.max(0, dialogQuality - 10);
      newStats[playerKey].destructive += 1;
    } else if (analysis.category === 'constructive' && analysis.confidence >= 75) {
      newQuality = Math.min(100, dialogQuality + 15);
      newStats[playerKey].constructive += 1;
    }
    const updatedMessages = [...currentMessages, newMessage];
    setMessages(updatedMessages);
    setDialogQuality(newQuality);
    setPlayerStats(newStats);
    setAnalyzing(false);
    setDemoIndex(index + 1);
    setTimeout(() => {
      playNextDemoMessage(index + 1, updatedMessages);
    }, 2500);
  };

  const analyzeWithAI = async (message: string, context: string) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context })
      });
      if (!response.ok) {
        console.error('API error:', await response.text());
        return { technique: 'neutral', category: 'neutral', confidence: 0, explanation: 'API error' };
      }
      return await response.json();
    } catch (error) {
      console.error('Analysis error:', error);
      return { technique: 'neutral', category: 'neutral', confidence: 0, explanation: '' };
    }
  };

  const renderTechniquesModal = () => {
    if (!showTechniquesModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Debate Techniques</h2>
            <button onClick={() => setShowTechniquesModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Destructive Techniques</h3>
              <p className="text-sm text-gray-600 mb-4">These techniques damage constructive dialogue and should be avoided.</p>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Strawmanning</h4>
                  <p className="text-sm text-gray-700 mt-1">Misrepresenting or exaggerating the opponent's argument to make it easier to attack.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> A: "We should improve public transit" → B: "So you want to ban cars?"</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Loaded Question</h4>
                  <p className="text-sm text-gray-700 mt-1">A question with a built-in, unproven assumption.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "Why do you hate freedom?" (assumes the person does)</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Personal Attack (Ad Hominem)</h4>
                  <p className="text-sm text-gray-700 mt-1">Attacking the person instead of the argument.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "You're too young to understand this"</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Whataboutism</h4>
                  <p className="text-sm text-gray-700 mt-1">Deflecting by pointing to another problem.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "What about America's problems?" (when discussing something else)</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">False Dilemma</h4>
                  <p className="text-sm text-gray-700 mt-1">Presenting only two options when more exist.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "You're either with us or against us"</p>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-xl font-bold text-green-600 mb-4">✨ Constructive Techniques</h3>
              <p className="text-sm text-gray-600 mb-4">These techniques build understanding and constructive dialogue.</p>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Steelmanning</h4>
                  <p className="text-sm text-gray-700 mt-1">Present the opponent's argument in its STRONGEST form before responding.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "If I understand correctly, you mean [strongly stated], which is an important point..."</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Acknowledging Valid Points</h4>
                  <p className="text-sm text-gray-700 mt-1">Recognize when the opponent makes a good point.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "You're right that X is a problem. At the same time, I think..."</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Seeking Genuine Clarification</h4>
                  <p className="text-sm text-gray-700 mt-1">Honestly ask what the opponent means - not as a trap.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "Can you explain what you mean by X? I want to understand your thinking"</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Finding Common Ground</h4>
                  <p className="text-sm text-gray-700 mt-1">Identify areas where you agree.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Example:</strong> "We both agree the problem exists, the difference is how we solve it"</p>
                </div>
              </div>
            </section>
            <section className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📚 Academic Sources</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Logical fallacies:</strong> Aristotle, "Sophistical Refutations" (~350 BCE); Irving Copi, "Introduction to Logic" (1953)</p>
                <p><strong>Constructive dialogue:</strong> Carl Rogers, "On Becoming a Person" (1961); Marshall Rosenberg, "Nonviolent Communication" (1999)</p>
                <p><strong>Steelmanning:</strong> Daniel Dennett, "Intuition Pumps and Other Tools for Thinking" (2013)</p>
                <p><strong>Street Epistemology:</strong> Peter Boghossian, "A Manual for Creating Atheists" (2013)</p>
              </div>
            </section>
          </div>
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
            <button onClick={() => setShowTechniquesModal(false)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'intro') {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Chattitude</h1>
              <p className="text-xl text-gray-700 mb-1">Better conversations</p>
              <p className="text-gray-600">AI-powered chat for tough topics</p>
            </div>
            <div className="space-y-6 mb-8">
              <div className="bg-purple-50 p-6 rounded-xl">
                <h2 className="font-bold text-lg mb-2">Why Chattitude?</h2>
                <p className="text-gray-700">AI coaches you in real-time to have constructive conversations about difficult topics.</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                <p className="text-sm font-semibold mb-2">⚠️ BETA VERSION:</p>
                <p className="text-sm text-gray-700">The AI is still learning and may make mistakes. Help us improve by reporting issues!</p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={startMultiplayer} className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Start a Conversation
              </button>
              <button onClick={startDemo} className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Play Demo: Peterson vs Newman
              </button>
              <button onClick={() => setShowTechniquesModal(true)} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Info className="w-5 h-5" />
                Learn Debate Techniques
              </button>
              <p className="text-center text-sm text-gray-500 mt-2">Watch AI analyze a real debate in real-time</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (view === 'create') {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Start a Conversation</h1>
              <p className="text-gray-600">Practice constructive dialogue with AI coaching</p>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-xl">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Your name:</label>
                <input type="text" value={player1Name} onChange={(e) => setPlayer1Name(e.target.value)} placeholder="e.g. Emma" className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400" />
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Topic to discuss:</label>
                <textarea value={thesis} onChange={(e) => setThesis(e.target.value)} placeholder="e.g. 'AI will replace most creative jobs within 5 years'" className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-green-400" rows={3} />
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200 mb-4">
              <p className="text-sm"><strong>🌐 Share with someone:</strong> You'll get a link to share with the person you want to talk to!</p>
            </div>
            <button onClick={createMultiplayerRoom} disabled={!player1Name.trim() || !thesis.trim()} className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
              Create Room & Copy Link
            </button>
            <button onClick={() => setView('intro')} className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Back</button>
          </div>
        </div>
      </>
    );
  }

  if (view === 'waiting' && isMultiplayer) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareLink = `${baseUrl}/?room=${roomIdInput}`;
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-pulse" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Waiting for the other person...</h1>
              <p className="text-gray-600">Share the link below with who you want to talk to!</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-xl mb-6">
              <p className="text-sm font-semibold mb-2">📋 Shareable link (copied!):</p>
              <div className="bg-white p-3 rounded-lg border-2 border-indigo-200 break-all text-sm">{shareLink}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 mb-6">
              <p className="text-sm"><strong>💡 Tip:</strong> Send the link via WhatsApp, SMS, or email!</p>
            </div>
            {roomData?.player2Name && (
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 mb-4">
                <p className="text-sm font-semibold text-green-800">✅ {roomData.player2Name} joined! Starting soon...</p>
              </div>
            )}
            <button onClick={() => setView('intro')} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </>
    );
  }

  if (view === 'join' && isMultiplayer) {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Join the conversation!</h1>
              {roomData && (
                <>
                  <p className="text-gray-600 mb-4">You're invited by <strong>{roomData.player1Name}</strong></p>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold mb-1">📝 Topic:</p>
                    <p className="text-gray-700">{roomData.thesis}</p>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Your name:</label>
                <input type="text" value={player2Name} onChange={(e) => setPlayer2Name(e.target.value)} placeholder="e.g. Anna" className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400" />
              </div>
            </div>
            <button onClick={joinMultiplayerRoom} disabled={!player2Name.trim()} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">Join Conversation</button>
          </div>
        </div>
      </>
    );
  }

  if (view === 'game') {
    const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
    const myPlayerNumber = parseInt(localStorage.getItem('myPlayerNumber') || '1');
    const isMyTurn = isMultiplayer ? currentPlayer === myPlayerNumber : true;
    
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-3xl mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen py-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Chattitude</h1>
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl mb-6 border-2 border-purple-200">
              <p className="text-gray-800 font-medium">{thesis}</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Conversation quality</span>
                <span className="text-sm">{dialogQuality}%</span>
              </div>
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${dialogQuality > 70 ? 'bg-green-500' : dialogQuality > 50 ? 'bg-yellow-500' : dialogQuality > 30 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${dialogQuality}%` }} />
              </div>
            </div>
            <div className="space-y-6 mb-6 max-h-96 overflow-y-auto px-2 py-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.playerNum === 1 ? 'items-start' : 'items-end'}`}>
                  <div onClick={() => { if (msg.analysis?.category !== 'neutral' && msg.analysis?.confidence >= 60) { setExpandedMessage(expandedMessage === idx ? null : idx); } }} className={`max-w-md p-3 rounded-2xl transition-all ${msg.analysis?.category !== 'neutral' && msg.analysis?.confidence >= 60 ? 'cursor-pointer hover:shadow-md' : ''} ${msg.playerNum === 1 ? 'bg-blue-100' : 'bg-purple-100'} ${msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 75 ? 'ring-2 ring-red-400' : msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 60 ? 'ring-1 ring-orange-300' : msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 75 ? 'ring-2 ring-green-400' : msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 60 ? 'ring-1 ring-green-300' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">{msg.player}</div>
                      {msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 75 && (<div className="text-base">⚠️</div>)}
                      {msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 60 && msg.analysis?.confidence < 75 && (<div className="text-base opacity-60">⚠️</div>)}
                      {msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 75 && (<div className="text-base">✨</div>)}
                      {msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 60 && msg.analysis?.confidence < 75 && (<div className="text-base opacity-60">✨</div>)}
                    </div>
                    <p className="text-gray-800 break-words">{msg.text}</p>
                    <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>
                    {expandedMessage === idx && msg.analysis && msg.analysis.category !== 'neutral' && msg.analysis.confidence >= 60 && (
                      <div className={`mt-3 pt-3 border-t text-xs ${msg.analysis.category === 'dirty_trick' ? 'border-red-200' : 'border-green-200'}`}>
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold">{msg.analysis.technique}<span className="ml-1 opacity-75">({msg.analysis.confidence}%)</span></p>
                          <button onClick={(e) => { e.stopPropagation(); setShowTechniquesModal(true); }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            <span className="text-xs">Learn more</span>
                          </button>
                        </div>
                        <p className="text-gray-700">{msg.analysis.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-6">
              {isDemo ? (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                    <p className="font-bold text-lg text-blue-900">Demo Mode</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{demoIndex < demoConversation.length ? `Message ${demoIndex + 1} of ${demoConversation.length}` : 'Demo complete! See how AI identified dirty tricks above.'}</p>
                  {analyzing && (<p className="text-xs text-gray-600">AI analyzing...</p>)}
                </div>
              ) : (
                <>
                  <div className="mb-3 text-sm font-semibold text-gray-600">
                    {isMultiplayer && !isMyTurn ? (<span className="text-orange-600">Waiting for {currentPlayerName}...</span>) : (<>It's <span className="text-purple-600">{currentPlayerName}'s</span> turn</>)}
                  </div>
                  <textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="Type your message..." disabled={false} className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-400 disabled:bg-gray-50" rows={3} />
                  <button onClick={handleMultiplayerMessage} disabled={!currentInput.trim() || analyzing || (isMultiplayer && !isMyTurn)} className="w-full mt-3 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {analyzing ? 'AI analyzing...' : 'Send Message'}
                  </button>
                </>
              )}
              <button onClick={() => setView('intro')} className="w-full mt-3 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                End Conversation
              </button>
              <button onClick={() => alert('Thank you for wanting to report! Feature coming soon. Contact lindahl.karl@gmail.com with feedback.')} className="w-full mt-2 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Report if AI made a mistake
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default ChattitudeGame;
