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
          content: `Du är en STRIKT debattdomare. Din uppgift är att AKTIVT leta efter destruktiva debatttekniker. Var INTE generös - markera problem när de finns.

KONTEXT: ${context || 'Detta är det första meddelandet.'}

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
