import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Du är en STRIKT debattdomare. Din uppgift är att AKTIVT leta efter destruktiva debatttekniker OCH konstruktiva metoder. Var INTE generös med dirty tricks - markera problem när de finns. Men var GENERÖS med att identifiera konstruktiva försök!

KONTEXT: ${context || 'Detta är det första meddelandet.'}

AKTUELLT MEDDELANDE: "${message}"

VIKTIGT: De flesta meddelanden i hetsiga debatter innehåller NÅGON form av retorisk teknik. "Neutral" ska bara användas för riktigt objektiva, sakliga påståenden.

=== DESTRUKTIVA TEKNIKER - LETA AKTIVT EFTER DESSA ===

**Strawmanning (MYCKET VANLIG):**
Feltolka eller överdriva motpartens argument.
Nyckelord att leta efter: "Så du säger/menar att...", "Alltså vill du...", "Med andra ord..."
Exempel 1: A: "Vi bör ha strängare gränskontroller" → B: "Så du vill stänga alla gränser helt?"
Exempel 2: A: "Lönegap har flera orsaker" → B: "Så du säger att kvinnor inte är diskriminerade?"
→ Om någon säger "Så du säger..." utan att motparten SA det = 85% Strawmanning

**Loaded Question (MYCKET VANLIG):**
Fråga med inbyggd, obevisad förutsättning.
Nyckelord: "Varför...", "Hur kan du...", frågor som antar något
Exempel 1: "Varför ska kvinnor acceptera X?" (antar att talaren sagt att de ska)
Exempel 2: "Hur kan du försvara Y?" (antar att personen försvarar det)
→ Om frågan innehåller ett antagande motparten INTE gjort = 85% Loaded Question

**Personal Attack:**
Attackera personen, inte argumentet.
Exempel: "Du är privilegierad", "Vad vet du", "Givetvis tycker DU så"
→ 80% Personal Attack

**Whataboutism:**
Peka på annat problem istället för att svara.
Exempel: "Vad sägs om USA då?", "Ditt parti gjorde värre"
→ 75% Whataboutism

=== KONSTRUKTIVA TEKNIKER - LETA AKTIVT EFTER DESSA ===

**Defensive Clarification:**
Korrigera en FELTOLKNING av din position.
Exempel: A: "Så du säger X?" → B: "Nej, jag säger inte X, jag säger Y"
→ Detta är NORMALT i debatt, inte extra konstruktivt = Neutral, 0 poäng

**Providing Nuance:**
Ge en nyanserad bild istället för svart/vitt.
Exempel: "Det finns flera faktorer: A, B och C"
→ Detta är BRA men inte konstruktivt samtalsskapande = Neutral, 0 poäng

=== KONSTRUKTIVA TEKNIKER - GER GRÖN RING & POÄNG ===

**Steelmanning (MYCKET KONSTRUKTIVT):**
Presentera motpartens argument i sin STARKASTE form innan du svarar.
Exempel: "Om jag förstår dig rätt menar du [starkt formulerat], vilket är en viktig poäng. Dock tänker jag att..."
→ 85%+ confidence = Steelmanning, +15 poäng

**Acknowledging Valid Points (KONSTRUKTIVT):**
Erkänna när motparten har rätt i något INNAN du säger din grej.
Exempel: "Du har rätt i att X är ett problem. Samtidigt..."
Exempel: "Det är sant att Y. Men..."
→ 80%+ confidence = Acknowledging, +10 poäng

**Seeking Genuine Clarification (KONSTRUKTIVT):**
Ärligt fråga vad motparten menar - INTE som fälla eller gotcha.
Exempel: "Kan du utveckla vad du menar med X?"
Exempel: "Jag är osäker på hur du tänker här, hjälp mig förstå"
→ 75%+ confidence = Seeking Clarification, +10 poäng

**Finding Common Ground (KONSTRUKTIVT):**
Aktivt identifiera var ni är ÖVERENS.
Exempel: "Vi är båda överens om att [problem] existerar, skillnaden är hur vi löser det"
→ 80%+ confidence = Finding Common Ground, +12 poäng

=== BEDÖMNINGSREGLER ===

**KATEGORISERING:**
- **dirty_trick** = Destruktiva tekniker som skadar dialog
- **constructive** = ENDAST tekniker som AKTIVT bygger konstruktiv dialog (Steelmanning, Acknowledging, etc.)
- **neutral** = Allt annat (normala svar, defensiv klarifiering, basic nyansering)

**KONTEXT ÄR VIKTIGT:**
- Om motparten använde strawmanning och personen korrigerar = NEUTRAL (inte konstruktiv, bara nödvändigt)
- Om motparten ställde loaded question och personen avvisar premissen = NEUTRAL
- Försvar mot dirty tricks är INTE i sig konstruktivt - det är normalt!

**GE HÖG CONFIDENCE FÖR KONSTRUKTIVA:**
Konstruktiva tekniker ska ha HÖG confidence för att ge poäng:
- Steelmanning: 85%+ 
- Acknowledging: 80%+
- Seeking Clarification: 75%+
- Finding Common Ground: 80%+

**VAR STRIKT MED VAD SOM ÄR "KONSTRUKTIVT":**
Det ska vara något EXTRA - inte bara normalt debattsvar!
- "Nej, jag säger inte det" = Neutral (försvar)
- "Det finns flera faktorer" = Neutral (basic nyansering)
- "Du har rätt i X, men jag tänker Y" = Konstruktiv! (acknowledging)

**"NEUTRAL" = SÄLLSYNT:**
Neutral betyder: Ren saklig information utan retoriska tricks och utan konstruktiva metoder.
Exempel: "Statistiken visar att X"

ANALYSERA NU MEDDELANDET:
Leta efter BÅDE destruktiva OCH konstruktiva tekniker.
Var strikt med dirty tricks, generös med konstruktiva metoder.

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ 
        error: 'API request failed',
        details: errorText 
      });
    }

    const data: any = await response.json();
    const text = data.content[0].text.trim().replace(/```json\n?|```\n?/g, '');
    const analysis = JSON.parse(text);
    
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze message',
      details: error.message 
    });
  }
}
