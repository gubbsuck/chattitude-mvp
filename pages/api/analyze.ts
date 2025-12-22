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

**Defensive Clarification (KONSTRUKTIV!):**
Korrigera en FELTOLKNING av din position. Detta är INTE destruktivt - det är nödvändigt!
Exempel 1: A: "Så du säger X?" → B: "Nej, jag säger inte X, jag säger Y"
Exempel 2: A: "Varför vill du Z?" → B: "Jag säger inte att jag vill Z"
→ Om någon KORRIGERAR en strawmanning eller loaded question = 80% Defensive Clarification (KONSTRUKTIV)

**Seeking Genuine Clarification:**
Ärligt fråga vad motparten menar (INTE som fälla).
Exempel: "Kan du utveckla vad du menar med X?"
→ 75% Seeking Clarification

**Acknowledging Valid Points:**
Erkänna när motparten har rätt i något.
Exempel: "Du har en poäng där", "Det är sant att X"
→ 80% Acknowledging

**Steelmanning:**
Presentera motpartens argument i sin starkaste form.
Exempel: "Om jag förstår dig rätt säger du [starkt formulerat]"
→ 85% Steelmanning

**Providing Nuance:**
Ge en nyanserad bild istället för svart/vitt.
Exempel: "Det finns flera faktorer: A, B och C"
→ 70% Providing Nuance (KONSTRUKTIVT)

=== BEDÖMNINGSREGLER ===

**KONTEXT ÄR VIKTIGT:**
- Om motparten använde strawmanning och personen korrigerar = KONSTRUKTIV
- Om motparten ställde loaded question och personen avvisar premissen = KONSTRUKTIV
- Försvar mot dirty tricks är INTE i sig destruktivt!

**GE HÖG CONFIDENCE:**
- 90-100: Tydligt textbook-exempel
- 75-89: Klart exempel på tekniken
- 60-74: Troligt exempel
- Under 60: Osäker = markera som neutral

**VAR GENERÖS MED KONSTRUKTIVA:**
Om någon GÖR ETT FÖRSÖK att vara konstruktiv, ge dem credit!
Om någon klarifierar, nyanserar, eller erkänner något - markera det!

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
