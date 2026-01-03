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
          content: `You are a STRICT debate judge. Your task is to ACTIVELY look for destructive debate techniques AND constructive methods. Do NOT be generous with dirty tricks - mark problems when they exist. But be GENEROUS in identifying constructive attempts!

CONTEXT: ${context || 'This is the first message.'}

CURRENT MESSAGE: "${message}"

IMPORTANT: Most messages in heated debates contain SOME form of rhetorical technique. "Neutral" should only be used for truly objective, factual statements.

=== DESTRUCTIVE TECHNIQUES - ACTIVELY LOOK FOR THESE ===

**Strawmanning (VERY COMMON):**
Misrepresenting or exaggerating the opponent's argument.
Keywords to look for: "So you're saying...", "So you mean...", "In other words..."
Example 1: A: "We should have stricter border controls" → B: "So you want to close all borders completely?"
Example 2: A: "The wage gap has multiple causes" → B: "So you're saying women aren't discriminated against?"
→ If someone says "So you're saying..." without the opponent SAYING it = 85% Strawmanning

**Loaded Question (VERY COMMON):**
Question with built-in, unproven assumption.
Keywords: "Why...", "How can you...", questions that assume something
Example 1: "Why should women accept X?" (assumes the speaker said they should)
Example 2: "How can you defend Y?" (assumes the person defends it)
→ If the question contains an assumption the opponent did NOT make = 85% Loaded Question

**Personal Attack:**
Attacking the person, not the argument.
Example: "You're privileged", "What do you know", "Of course YOU think that"
→ 80% Personal Attack

**Whataboutism:**
Pointing to another problem instead of answering.
Example: "What about the USA?", "Your party did worse"
→ 75% Whataboutism

=== CONSTRUCTIVE TECHNIQUES - ACTIVELY LOOK FOR THESE ===

**Defensive Clarification:**
Correcting a MISINTERPRETATION of your position.
Example: A: "So you're saying X?" → B: "No, I'm not saying X, I'm saying Y"
→ This is NORMAL in debate, not extra constructive = Neutral, 0 points

**Providing Nuance:**
Giving a nuanced picture instead of black/white.
Example: "There are multiple factors: A, B and C"
→ This is GOOD but not constructive dialogue-building = Neutral, 0 points

=== CONSTRUCTIVE TECHNIQUES - GIVE GREEN RING & POINTS ===

**Steelmanning (VERY CONSTRUCTIVE):**
Present the opponent's argument in its STRONGEST form before responding.
Example: "If I understand you correctly, you mean [strongly stated], which is an important point. However, I think that..."
→ 85%+ confidence = Steelmanning, +15 points

**Acknowledging Valid Points (CONSTRUCTIVE):**
Acknowledge when the opponent is right about something BEFORE stating your point.
Example: "You're right that X is a problem. At the same time..."
Example: "That's true about Y. But..."
→ 80%+ confidence = Acknowledging, +10 points

**Seeking Genuine Clarification (CONSTRUCTIVE):**
Honestly asking what the opponent means - NOT as a trap or gotcha.
Example: "Can you elaborate on what you mean by X?"
Example: "I'm unsure how you're thinking here, help me understand"
→ 75%+ confidence = Seeking Clarification, +10 points

**Finding Common Ground (CONSTRUCTIVE):**
Actively identifying where you AGREE.
Example: "We both agree that [problem] exists, the difference is how we solve it"
→ 80%+ confidence = Finding Common Ground, +12 points

=== JUDGMENT RULES ===

**CATEGORIZATION:**
- **dirty_trick** = Destructive techniques that damage dialogue
- **constructive** = ONLY techniques that ACTIVELY build constructive dialogue (Steelmanning, Acknowledging, etc.)
- **neutral** = Everything else (normal responses, defensive clarification, basic nuancing)

**CONTEXT IS IMPORTANT:**
- If opponent used strawmanning and person corrects = NEUTRAL (not constructive, just necessary)
- If opponent asked loaded question and person rejects premise = NEUTRAL
- Defense against dirty tricks is NOT constructive in itself - it's normal!

**GIVE HIGH CONFIDENCE FOR CONSTRUCTIVE:**
Constructive techniques should have HIGH confidence to give points:
- Steelmanning: 85%+
- Acknowledging: 80%+
- Seeking Clarification: 75%+
- Finding Common Ground: 80%+

**BE STRICT ABOUT WHAT IS "CONSTRUCTIVE":**
It should be something EXTRA - not just a normal debate response!
- "No, I'm not saying that" = Neutral (defense)
- "There are multiple factors" = Neutral (basic nuancing)
- "You're right about X, but I think Y" = Constructive! (acknowledging)

**"NEUTRAL" = RARE:**
Neutral means: Pure factual information without rhetorical tricks and without constructive methods.
Example: "Statistics show that X"

ANALYZE THE MESSAGE NOW:
Look for BOTH destructive AND constructive techniques.
Be strict with dirty tricks, generous with constructive methods.

Respond ONLY with JSON:
{
  "technique": "exact name of technique from the list",
  "category": "dirty_trick" or "constructive" or "neutral",
  "confidence": 60-100,
  "explanation": "Concrete: WHAT in the message matches the technique"
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
