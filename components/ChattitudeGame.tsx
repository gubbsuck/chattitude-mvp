import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Info, Users, Sparkles, Trophy } from 'lucide-react';
import { useMultiplayerRoom } from '../hooks/useMultiplayerRoom';
import { useRouter } from 'next/router';

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
  const { roomData, isConnected, createRoom, joinRoom, sendMessage } = useMultiplayerRoom(roomIdInput || null);

  // Demo conversation data - Peterson vs Newman
  const demoConversation = [
    {
      player: "Cathy",
      text: "Du har sagt att män behöver växa upp och organisera sig. Hur hjälper det kvinnor?",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Jag säger att samhället fungerar bättre när människor tar ansvar. Det gäller alla.",
      playerNum: 1
    },
    {
      player: "Cathy",
      text: "Men du pratar ju mest om män. Varför ska kvinnor acceptera ditt budskap?",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Jag säger inte att de ska 'acceptera' det. Jag säger att påståendet att lönegapet mellan män och kvinnor bara beror på kön är fel.",
      playerNum: 1
    },
    {
      player: "Cathy",
      text: "Så du säger att kvinnor inte är diskriminerade på arbetsmarknaden?",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Nej, jag säger inte det. Det finns multipla faktorer. Utbildning, yrke, arbetade timmar, personlighet.",
      playerNum: 1
    },
    {
      player: "Cathy",
      text: "Men resultatet är att kvinnor tjänar mindre. Det är fakta.",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Ja, men att säga att det ENBART beror på diskriminering är förenklat. Vi måste titta på alla variabler.",
      playerNum: 1
    },
    {
      player: "Cathy",
      text: "Varför skulle kvinnor välja lägre betalda jobb om de har samma möjligheter?",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Det är en bra fråga. Forskning visar att i länder med mer jämställdhet blir skillnaderna i yrkesval större, inte mindre. Det kallas 'gender equality paradoxen'.",
      playerNum: 1
    },
    {
      player: "Cathy",
      text: "Men är inte det bevis på att systemet är riggat?",
      playerNum: 2
    },
    {
      player: "Jordan",
      text: "Eller så visar det att män och kvinnor i genomsnitt har olika intressen när de har frihet att välja. Det betyder inte att alla är likadana.",
      playerNum: 1
    }
 ];

  // Check URL for room ID on mount
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

  // Sync room data to local state
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
    }
  }, [roomData, isMultiplayer]);

  const startDebate = () => {
    if (!player1Name.trim() || !player2Name.trim() || !thesis.trim()) return;
    setView('game');
  };

  const startDemo = async () => {
    setIsDemo(true);
    setPlayer1Name('Jordan');
    setPlayer2Name('Cathy');
    setThesis('Lönegapet mellan män och kvinnor beror primärt på könsdiskriminering');
    setView('game');
    setDemoIndex(0);
    };

const startMultiplayer = () => {
  setIsMultiplayer(true);
  setView('create');
};

const createMultiplayerRoom = async () => {
  if (!player1Name.trim() || !thesis.trim()) return;
  
  const newRoomId = await createRoom(thesis, player1Name);
  setRoomIdInput(newRoomId);
  
  // Generate shareable link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const link = `${baseUrl}/?room=${newRoomId}`;
  
  setView('waiting');
  
  // Copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(link);
  }
};

const joinMultiplayerRoom = async () => {
  if (!player2Name.trim() || !roomIdInput) return;
  
  await joinRoom(roomIdInput, player2Name);
  setView('game');
};

const handleMultiplayerMessage = async () => {
  if (!currentInput.trim() || analyzing || !roomIdInput) return;
  
  setAnalyzing(true);
  
  const context = messages.length > 0
    ? messages.slice(-2).map(m => `${m.player}: ${m.text}`).join('\n')
    : 'Detta är det första meddelandet.';
  
  const analysis = await analyzeWithAI(currentInput, context);
  
  const playerNum = player1Name === roomData?.player1Name ? 1 : 2;
  const playerName = playerNum === 1 ? player1Name : player2Name;
  
  await sendMessage(roomIdInput, playerNum, playerName, currentInput, analysis);
  
  setCurrentInput('');
  setAnalyzing(false);
};

const playNextDemoMessage = async (index: number, currentMessages: any[]) => {

    // Start playing demo messages
    playNextDemoMessage(0, []);
  };

  const playNextDemoMessage = async (index: number, currentMessages: any[]) => {
    if (index >= demoConversation.length) {
      setIsDemo(false);
      return;
    }

    const demoMsg = demoConversation[index];
    setAnalyzing(true);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get context for AI
    const context = currentMessages.length > 0 
      ? currentMessages.slice(-2).map(m => `${m.player}: ${m.text}`).join('\n')
      : 'Detta är det första meddelandet.';
    
    const analysis = await analyzeWithAI(demoMsg.text, context);
    
    const newMessage = {
      player: demoMsg.player,
      playerNum: demoMsg.playerNum,
      text: demoMsg.text,
      timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      analysis: analysis
    };

    // Update quality based on analysis
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
    
    // Continue to next message after delay
    setTimeout(() => {
      playNextDemoMessage(index + 1, updatedMessages);
    }, 2500);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim() || countdown !== null) return;
    setCountdown(10);
  };

  const handleCancelAndEdit = () => {
    setCountdown(null);
  };

  const handleSendNow = () => {
    setCountdown(0);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      sendMessage();
    }
  }, [countdown]);

  const sendMessage = async () => {
    setAnalyzing(true);
    
    const playerName = currentPlayer === 1 ? player1Name : player2Name;
    const playerKey = currentPlayer === 1 ? 'player1' : 'player2' as 'player1' | 'player2';
    
    // Simple AI analysis
    const context = messages.length > 0 
      ? messages.slice(-2).map(m => `${m.player}: ${m.text}`).join('\n')
      : 'Detta är det första meddelandet.';
    
    const analysis = await analyzeWithAI(currentInput, context);
    
    const newMessage = {
      player: playerName,
      playerNum: currentPlayer,
      text: currentInput,
      timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      analysis: analysis
    };

    // Update quality based on analysis
    let newQuality = dialogQuality;
    let newStats = { ...playerStats };
    
    if (analysis.category === 'dirty_trick' && analysis.confidence >= 75) {
      newQuality = Math.max(0, dialogQuality - 10);
      newStats[playerKey].destructive += 1;
    } else if (analysis.category === 'constructive' && analysis.confidence >= 75) {
      newQuality = Math.min(100, dialogQuality + 15); // Bigger boost for constructive!
      newStats[playerKey].constructive += 1;
    }

    setMessages([...messages, newMessage]);
    setDialogQuality(newQuality);
    setPlayerStats(newStats);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentInput('');
    setCountdown(null);
    setAnalyzing(false);
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

  // TECHNIQUES MODAL (renderas över andra vyer)
  const renderTechniquesModal = () => {
    if (!showTechniquesModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Debatttekniker</h2>
            <button
              onClick={() => setShowTechniquesModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Destruktiva tekniker */}
            <section>
              <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Destruktiva tekniker</h3>
              <p className="text-sm text-gray-600 mb-4">Dessa tekniker skadar konstruktiv dialog och bör undvikas.</p>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Strawmanning</h4>
                  <p className="text-sm text-gray-700 mt-1">Feltolka eller överdriva motpartens argument för att lättare attackera det.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> A: "Vi bör ha bättre kollektivtrafik" → B: "Så du vill förbjuda bilar?"</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Loaded Question</h4>
                  <p className="text-sm text-gray-700 mt-1">Fråga med inbyggd, obevisad förutsättning.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Varför hatar du frihet?" (antar att personen gör det)</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Personal Attack (Ad Hominem)</h4>
                  <p className="text-sm text-gray-700 mt-1">Attackera personen istället för argumentet.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Du är för ung för att förstå detta"</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Whataboutism</h4>
                  <p className="text-sm text-gray-700 mt-1">Avleda genom att peka på annat problem.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Vad sägs om USA:s problem då?" (när man diskuterar annat)</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">False Dilemma</h4>
                  <p className="text-sm text-gray-700 mt-1">Presentera endast två alternativ när fler finns.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Antingen är du med oss eller mot oss"</p>
                </div>
              </div>
            </section>

            {/* Konstruktiva tekniker */}
            <section>
              <h3 className="text-xl font-bold text-green-600 mb-4">✨ Konstruktiva tekniker</h3>
              <p className="text-sm text-gray-600 mb-4">Dessa tekniker bygger förståelse och konstruktiv dialog.</p>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Steelmanning</h4>
                  <p className="text-sm text-gray-700 mt-1">Presentera motpartens argument i sin STARKASTE form innan du svarar.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Om jag förstår dig rätt menar du [starkt formulerat], vilket är en viktig poäng..."</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Acknowledging Valid Points</h4>
                  <p className="text-sm text-gray-700 mt-1">Erkänna när motparten har rätt i något.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Du har rätt i att X är ett problem. Samtidigt tänker jag att..."</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Seeking Genuine Clarification</h4>
                  <p className="text-sm text-gray-700 mt-1">Ärligt fråga vad motparten menar - inte som fälla.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Kan du utveckla vad du menar med X? Jag vill förstå din tankegång"</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800">Finding Common Ground</h4>
                  <p className="text-sm text-gray-700 mt-1">Identifiera områden där ni är överens.</p>
                  <p className="text-xs text-gray-600 mt-2"><strong>Exempel:</strong> "Vi är båda överens om att problemet existerar, skillnaden är hur vi löser det"</p>
                </div>
              </div>
            </section>

            {/* Källor */}
            <section className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📚 Akademiska källor</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Logiska felslut:</strong> Aristotle, "Sophistical Refutations" (~350 BCE); Irving Copi, "Introduction to Logic" (1953)</p>
                <p><strong>Konstruktiv dialog:</strong> Carl Rogers, "On Becoming a Person" (1961); Marshall Rosenberg, "Nonviolent Communication" (1999)</p>
                <p><strong>Steelmanning:</strong> Daniel Dennett, "Intuition Pumps and Other Tools for Thinking" (2013)</p>
                <p><strong>Street Epistemology:</strong> Peter Boghossian, "A Manual for Creating Atheists" (2013)</p>
              </div>
            </section>
          </div>
          
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
            <button
              onClick={() => setShowTechniquesModal(false)}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // INTRO VIEW
  if (view === 'intro') {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Chattitude</h1>
            <p className="text-gray-600 mb-2">Konstruktiv debatt genom gamification</p>
            <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">AI-Powered Detection</span>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-purple-50 p-6 rounded-xl">
              <h2 className="font-bold text-lg mb-2">Varför Chattitude?</h2>
              <p className="text-gray-700">AI coachar er i realtid att föra konstruktiva diskussioner.</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold mb-2">⚠️ BETA-version:</p>
              <p className="text-sm text-gray-700">
                AI:n lär sig fortfarande och kan göra fel. Hjälp oss förbättra genom att rapportera konstigheter!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setView('create')}
              className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Skapa Debatt
            </button>
            
            <button
              onClick={startDemo}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Spela Demo: Peterson vs Newman
            </button>
            </button>
            
            <button
              onClick={startMultiplayer}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Skapa Multiplayer-debatt
            </button>

            <button
onClick={() => setShowTechniquesModal(true)}>
            <button
              onClick={() => setShowTechniquesModal(true)}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Info className="w-5 h-5" />
              Lär dig om debatttekniker
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-2">
              Se AI:n analysera en riktig debatt i realtid
            </p>
          </div>
        </div>
      </div>
      </>
    );
  }

  // CREATE VIEW
  if (view === 'create') {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Skapa Debatt</h1>
            <p className="text-gray-600">Träna konstruktiv dialog med AI-coaching</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-xl">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Ditt namn:</label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="T.ex. Emma"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Motpartens namn:</label>
              <input
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="T.ex. Alex"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Debattämne:</label>
              {analyzing && (
              <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <p className="font-bold text-lg">AI analyserar...</p>
                </div>
                <p className="text-sm text-gray-600">Detta tar några sekunder</p>
              </div>
            )}

            <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="T.ex. 'AI kommer ersätta de flesta kreativa jobb inom 5 år'"
                className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-green-400"
                rows={3}
              />
            </div>
          </div>

          <button
onClick={isMultiplayer ? createMultiplayerRoom : startDebate}
            disabled={!player1Name.trim() || !player2Name.trim() || !thesis.trim()}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isMultiplayer ? 'Skapa Rum & Kopiera Länk' : 'Starta Debatt'}
          </button>

          <button
            onClick={() => setView('intro')}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Tillbaka
          </button>
        </div>
      </div>
      </>
    );
  }
// WAITING VIEW (waiting for player 2)
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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Väntar på motdebattör...</h1>
              <p className="text-gray-600">Dela länken nedan med den du vill debattera!</p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl mb-6">
              <p className="text-sm font-semibold mb-2">📋 Delbar länk (kopierad!):</p>
              <div className="bg-white p-3 rounded-lg border-2 border-indigo-200 break-all text-sm">
                {shareLink}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 mb-6">
              <p className="text-sm"><strong>💡 Tips:</strong> Skicka länken via WhatsApp, SMS eller mejl till din motdebattör!</p>
            </div>

            {roomData?.player2Name && (
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 mb-4">
                <p className="text-sm font-semibold text-green-800">
                  ✅ {roomData.player2Name} har gått med! Startar snart...
                </p>
              </div>
            )}

            <button
              onClick={() => setView('intro')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      </>
    );
  }

  // JOIN VIEW (player 2 joining)
  if (view === 'join' && isMultiplayer) {
    return (
      <>
        {renderTechniquesModal()}
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Gå med i debatten!</h1>
              {roomData && (
                <>
                  <p className="text-gray-600 mb-4">Du bjuds in av <strong>{roomData.player1Name}</strong></p>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold mb-1">📝 Tes:</p>
                    <p className="text-gray-700">{roomData.thesis}</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Ditt namn:</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="T.ex. Anna"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <button
              onClick={joinMultiplayerRoom}
              disabled={!player2Name.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Gå med i debatten
            </button>
          </div>
        </div>
      </>
    );
  }

  // GAME VIEW
  if (view === 'game') {
    const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
const isMyTurn = isMultiplayer 
  ? currentPlayer === (player1Name === roomData?.player1Name ? 1 : 2)
  : true;
    
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
              <span className="font-semibold text-sm">Dialog-kvalitet</span>
              <span className="text-sm">{dialogQuality}%</span>
            </div>
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  dialogQuality > 70 ? 'bg-green-500' : 
                  dialogQuality > 50 ? 'bg-yellow-500' : 
                  dialogQuality > 30 ? 'bg-orange-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${dialogQuality}%` }}
              />
            </div>
          </div>

          <div className="space-y-6 mb-6 max-h-96 overflow-y-auto px-2 py-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.playerNum === 1 ? 'items-start' : 'items-end'}`}>
                <div 
                  onClick={() => {
                    if (msg.analysis?.category !== 'neutral' && msg.analysis?.confidence >= 60) {
                      setExpandedMessage(expandedMessage === idx ? null : idx);
                    }
                  }}
                  className={`max-w-md p-3 rounded-2xl transition-all ${
                    msg.analysis?.category !== 'neutral' && msg.analysis?.confidence >= 60 ? 'cursor-pointer hover:shadow-md' : ''
                  } ${
                    msg.playerNum === 1 ? 'bg-blue-100' : 'bg-purple-100'
                  } ${
                    msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 75
                      ? 'ring-2 ring-red-400'
                      : msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 60
                      ? 'ring-1 ring-orange-300'
                      : msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 75
                      ? 'ring-2 ring-green-400'
                      : msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 60
                      ? 'ring-1 ring-green-300'
                      : ''
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm">{msg.player}</div>
                    {msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 75 && (
                      <div className="text-base">⚠️</div>
                    )}
                    {msg.analysis?.category === 'dirty_trick' && msg.analysis?.confidence >= 60 && msg.analysis?.confidence < 75 && (
                      <div className="text-base opacity-60">⚠️</div>
                    )}
                    {msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 75 && (
                      <div className="text-base">✨</div>
                    )}
                    {msg.analysis?.category === 'constructive' && msg.analysis?.confidence >= 60 && msg.analysis?.confidence < 75 && (
                      <div className="text-base opacity-60">✨</div>
                    )}
                  </div>
                  <p className="text-gray-800 break-words">{msg.text}</p>
                  <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>
                  
                  {expandedMessage === idx && msg.analysis && msg.analysis.category !== 'neutral' && msg.analysis.confidence >= 60 && (
                    <div className={`mt-3 pt-3 border-t text-xs ${
                      msg.analysis.category === 'dirty_trick' ? 'border-red-200' : 'border-green-200'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold">
                          {msg.analysis.technique}
                          <span className="ml-1 opacity-75">({msg.analysis.confidence}%)</span>
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTechniquesModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          <span className="text-xs">Lär dig mer</span>
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
                <p className="text-sm text-gray-700 mb-2">
                  {demoIndex < demoConversation.length 
                    ? `Meddelande ${demoIndex + 1} av ${demoConversation.length}`
                    : 'Demo klar! Se hur AI:n identifierade dirty tricks ovan.'}
                </p>
                {analyzing && (
                  <p className="text-xs text-gray-600">AI analyserar...</p>
                )}
              </div>
            ) : (
              <>
               <div className="mb-3 text-sm font-semibold text-gray-600">
  {isMultiplayer && !isMyTurn ? (
    <span className="text-orange-600">Väntar på {currentPlayerName}...</span>
  ) : (
    <>Nu är det <span className="text-purple-600">{currentPlayerName}s</span> tur</>
  )}
</div>
                
                {countdown !== null && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-center">
                    <p className="font-bold text-lg">Vänta ett ögonblick!</p>
                    <p className="text-gray-700 mb-2">Är du säker på detta?</p>
                    <div className="text-3xl font-bold text-yellow-600 mb-3">00:{countdown.toString().padStart(2, '0')}</div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCancelAndEdit}
                        className="bg-white text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors border-2 border-gray-300"
                      >
                        Avbryt & Redigera
                      </button>
                      <button
                        onClick={handleSendNow}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Skicka Direkt
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Skriv ditt meddelande..."
                  disabled={countdown !== null}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-400 disabled:bg-gray-50"
                  rows={3}
                />
                
                <button
                  onClick={isMultiplayer ? handleMultiplayerMessage : handleSendMessage}
disabled={!currentInput.trim() || countdown !== null || analyzing || (isMultiplayer && !isMyTurn)}
                  className="w-full mt-3 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {countdown !== null ? 'Reflekterar...' : analyzing ? 'Analyserar med AI...' : 'Skicka Meddelande'}
                </button>
              </>
            )}
            
            <button
              onClick={() => setView('intro')}
              className="w-full mt-3 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Ditt sista ord
            </button>
            
            <button
              onClick={() => alert('Tack för att du vill rapportera! Funktion kommer snart. Kontakta karl@chattitude.se med feedback.')}
              className="w-full mt-2 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Rapportera om AI:n gjorde fel
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