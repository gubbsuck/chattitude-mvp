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

  const startDebate = () => {
    if (!player1Name.trim() || !player2Name.trim() || !thesis.trim()) return;
    setView('game');
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
            content: `Du är expert på att analysera debatter och identifiera retoriska tekniker.

KONTEXT: ${context}

AKTUELLT MEDDELANDE: "${message}"

Analysera meddelandet noggrant och identifiera om det använder destruktiva eller konstruktiva debatttekniker.

=== DESTRUKTIVA TEKNIKER (dirty tricks) ===

**Loaded Question / Begging the Question:**
Fråga som innehåller en obevisad förutsättning.
Exempel 1: "Varför ska kvinnor acceptera löneskillnader?" (när motparten aldrig sagt att de ska det)
Exempel 2: "När slutade du slå din fru?" (antar att personen gjort det)
Exempel 3: "Varför hatar du frihet?" (antar hat som aldrig uttryckts)

**Strawmanning:**
Feltolka eller överdriva motpartens argument för att lättare attackera det.
Exempel 1: A: "Vi bör ha strängare gränskontroller" → B: "Så du vill stänga alla gränser helt?"
Exempel 2: A: "Kanske vi ska äta mindre kött" → B: "Du vill alltså förbjuda kött?"
Exempel 3: A: "Polisen behöver mer utbildning" → B: "Så poliser är inkompetenta menar du?"

**Personal Attack / Ad Hominem:**
Attackera personen istället för argumentet.
Exempel 1: "Du är bara ett privilegierat barn, vad vet du om verkligheten?"
Exempel 2: "Givetvis tycker DU så, du är ju sosse/höger/feminist"
Exempel 3: "Du har aldrig jobbat en dag i ditt liv, så tyst"

**Whataboutism:**
Avleda genom att peka på annat problem istället för att svara.
Exempel 1: "Vad sägs om USA:s brott då?" (när man diskuterar Ryssland)
Exempel 2: "Men vad sägs om DITT partis skandal för 10 år sen?"
Exempel 3: "Varför pratar vi inte om migration istället?"

**Moving Goalposts:**
Ändra kraven när motparten uppfyller dem.
Exempel 1: "Visa källa" → *visar* → "Nej inte den källan, en annan"
Exempel 2: "Det fungerar inte i praktiken" → *visar att det gör det* → "Men det skalas inte upp"

**Gotcha Question:**
Ställa fällor för att få motparten att säga något dumt.
Exempel 1: "Nämn exakt tre källor på rak arm, annars har du fel"
Exempel 2: "Definiera feminism på 10 sekunder" (som fälla)

**False Dilemma:**
Presentera endast två alternativ när fler finns.
Exempel 1: "Antingen är du med oss eller mot oss"
Exempel 2: "Vi kan ha frihet ELLER säkerhet, välj ett"

=== KONSTRUKTIVA TEKNIKER ===

**Steelmanning:**
Presentera motpartens argument i sin STARKASTE form.
Exempel: "Om jag förstår dig rätt säger du att [starkt formulerat], vilket är en bra poäng"

**Re-Expression / Paraphrasing:**
Upprepa motpartens poäng för att visa förståelse.
Exempel: "Så om jag fattar rätt menar du att...?"

**Seeking Genuine Clarification:**
Ärligt fråga vad motparten menar (inte som fälla).
Exempel: "Kan du utveckla vad du menar med X?"
Exempel: "Jag är osäker på hur du tänker här, kan du förklara?"

**Finding Common Ground:**
Identifiera områden där ni är överens.
Exempel: "Vi är båda överens om att problemet existerar, skillnaden är hur vi löser det"

**Acknowledging Valid Points:**
Erkänna när motparten har rätt i något.
Exempel: "Du har en poäng där, jag håller med om att..."
Exempel: "Det är sant att X, men jag tänker annorlunda om Y"

**Building On:**
Utveckla motpartens idéer konstruktivt.
Exempel: "Intressant perspektiv. Tänk om vi kombinerade din idé med..."

=== INSTRUKTIONER ===

VAR SÄRSKILT UPPMÄRKSAM PÅ:
- Frågor som innehåller ej bevisade antaganden (jämför med Loaded Question-exemplen)
- Feltolkningar av vad motparten faktiskt sa (jämför med Strawmanning-exemplen)
- Förenklingar eller överdrifter av motpartens position
- Försök att sätta ord i munnen på motparten

CONFIDENCE-NIVÅER:
- 85-100: Tydligt exempel på tekniken, mycket likt exemplen ovan
- 70-84: Troligt exempel, men lite mer subtilt
- 60-69: Möjligt exempel, viss osäkerhet
- Under 60: För osäkert, markera som neutral

Svara ENDAST med JSON:
{
  "technique": "exakt namn på tekniken från listan ovan",
  "category": "dirty_trick" eller "constructive" eller "neutral",
  "confidence": 0-100,
  "explanation": "konkret förklaring på svenska om VAD i meddelandet som matchar tekniken, referera gärna till liknande exempel"
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

          <button
            onClick={() => setView('create')}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Skapa Debatt
          </button>
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