import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Info, Users, Sparkles, Trophy } from 'lucide-react';

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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Du är en STRIKT debattdomare. Din uppgift är att AKTIVT leta efter destruktiva debatttekniker. Var INTE generös - markera problem när de finns.

KONTEXT: ${context}

AKTUELLT MEDDELANDE: "${message}"

VIKTIGT: De flesta meddelanden i hetsiga debatter innehåller NÅGON form av retorisk teknik. "Neutral" ska bara användas för riktigt objektiva, sakliga påståenden.

=== DESTRUKTIVA TEKNIKER - LETA AKTIVT EFTER DESSA ===

**Strawmanning (MYCKET VANLIG):**
Feltolka eller överdriva motpartens argument.
Nyckelord att leta efter: "Så du säger/menar att...", "Alltså vill du...", "Med andra ord..."
Exempel 1: A: "Vi bör ha strängare gränskontroller" → B: "Så du vill stänga alla gränser helt?"
Exempel 2: A: "Lönegap har flera orsaker" → B: "Så du säger att kvinnor inte är diskriminerade?"
Exempel 3: A: "Polisen behöver mer utbildning" → B: "Alltså är alla poliser inkompetenta?"
→ Om någon säger "Så du säger..." utan att motparten SA det = 90% Strawmanning

**Loaded Question (MYCKET VANLIG):**
Fråga med inbyggd, obevisad förutsättning.
Nyckelord: "Varför...", "Hur kan du...", frågor som antar något
Exempel 1: "Varför ska kvinnor acceptera X?" (antar att talaren sagt att de ska)
Exempel 2: "Hur kan du försvara Y?" (antar att personen försvarar det)
Exempel 3: "Varför hatar du frihet?" (antar hat)
→ Om frågan innehåller ett antagande motparten INTE gjort = 85% Loaded Question

**Personal Attack:**
Attackera personen, inte argumentet.
Exempel: "Du är privilegierad", "Vad vet du", "Givetvis tycker DU så"

**Whataboutism:**
Peka på annat problem istället för att svara.
Exempel: "Vad sägs om USA då?", "Ditt parti gjorde värre"

**False Dilemma:**
Bara två alternativ när fler finns.
Exempel: "Antingen frihet ELLER säkerhet"

=== KONSTRUKTIVA TEKNIKER ===

**Seeking Clarification:**
Exempel: "Kan du utveckla vad du menar?"

**Acknowledging:**
Exempel: "Du har en poäng", "Det är sant att..."

**Steelmanning:**
Exempel: "Om jag förstår dig rätt säger du [starkt formulerat]"

=== BEDÖMNINGSREGLER ===

**STRIKT BEDÖMNING:**
- Om meddelandet FELTOLKAR motparten = minst 70% Strawmanning
- Om frågan ANTAR något obevisat = minst 75% Loaded Question
- Om svaret UNDVIKER frågan = minst 60% Evasion

**GE HÖG CONFIDENCE:**
- 90-100: Tydligt textbook-exempel
- 75-89: Klart exempel på tekniken
- 60-74: Troligt exempel
- Under 60: Osäker = markera som neutral

**"NEUTRAL" = VÄLDIGT SÄLLSYNT:**
Neutral betyder: Saklig, objektiv information utan retoriska tricks.
Exempel på neutral: "Statistiken visar att X", "Studien fann att Y"
Det mesta i debatter är INTE neutralt.

ANALYSERA NU MEDDELANDET:
Vad är den MEST TROLIGA tekniken? Var INTE försiktig - om det luktar strawmanning, säg strawmanning. Om det luktar loaded question, säg loaded question.

Svara ENDAST JSON:
{
  "technique": "exakt namn på tekniken från listan",
  "category": "dirty_trick" eller "constructive" eller "neutral",
  "confidence": 60-100,
  "explanation": "Konkret: VAD i meddelandet som matchar tekniken"
}`
          }]
        })
      });

      const data: any = await response.json();
      const text = data.content[0].text.trim().replace(/```json\n?|```\n?/g, '');
      return JSON.parse(text);
    } catch (error) {
      return { technique: 'neutral', category: 'neutral', confidence: 0, explanation: '' };
    }
  };

  // INTRO VIEW
  if (view === 'intro') {
    return (
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
            
            <p className="text-center text-sm text-gray-500 mt-2">
              Se AI:n analysera en riktig debatt i realtid
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CREATE VIEW
  if (view === 'create') {
    return (
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

            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
              <p className="text-sm font-semibold mb-2">💡 Tips:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Rekommenderad tid: 10-15 minuter</li>
                <li>• Ca 5-7 repliker vardera</li>
                <li>• Avsluta när ni känner er klara</li>
              </ul>
            </div>
          </div>

          <button
            onClick={startDebate}
            disabled={!player1Name.trim() || !player2Name.trim() || !thesis.trim()}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Starta Debatt
          </button>

          <button
            onClick={() => setView('intro')}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  // GAME VIEW
  if (view === 'game') {
    const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;
    
    return (
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
                      <p className="font-semibold mb-1">
                        {msg.analysis.technique}
                        <span className="ml-1 opacity-75">({msg.analysis.confidence}%)</span>
                      </p>
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
                  Nu är det <span className="text-purple-600">{currentPlayerName}s</span> tur
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
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || countdown !== null || analyzing}
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
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChattitudeGame;