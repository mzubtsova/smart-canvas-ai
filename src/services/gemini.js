/**
 * Service client for Gemini API integrations.
 * Works client-side using fetch.
 * Provides rich mock fallbacks if no API Key is supplied.
 */

// Model to use
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Safely parse JSON from LLM markdown response blocks if present.
 */
function cleanAndParseJSON(text) {
  try {
    // If it's wrapped in a markdown code block ```json ... ```, strip it
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (e) {
    console.error("Failed to parse JSON from response text:", text, e);
    throw new Error("Invalid JSON format in model output.");
  }
}

/**
 * Make API request to Gemini API with robust retries
 */
async function callGemini(prompt, apiKey, systemInstruction = '') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const maxRetries = 3;
  let delay = 1500; // Start with 1.5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP error! status: ${response.status}`;
        
        // Retry on 503 (high demand), 429 (rate limit), or if the message mentions overload/demand
        const isRetryable = response.status === 503 || 
                            response.status === 429 || 
                            errMsg.toLowerCase().includes('demand') || 
                            errMsg.toLowerCase().includes('overloaded') ||
                            errMsg.toLowerCase().includes('resource_exhausted') ||
                            errMsg.toLowerCase().includes('capacity');

        if (isRetryable && attempt < maxRetries) {
          console.warn(`Gemini API attempt ${attempt} failed with: "${errMsg}". Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2.5; // Exponential backoff
          continue;
        }
        
        throw new Error(errMsg);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("No response text received from Gemini.");
      }

      return cleanAndParseJSON(textResponse);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Gemini API attempt ${attempt} threw: "${error.message}". Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
}

/**
 * Draft a campaign (Subject lines, push, HTML template with Liquid syntax)
 */
export async function generateCampaign({ objective, voice, variables, variantsCount = 2 }, apiKey) {
  if (!apiKey) {
    // Return rich simulated mock data contextually
    return getMockCampaign(objective, voice, variables, variantsCount);
  }

  const systemInstruction = `You are an expert lifecycle email marketer and Braze HTML developer.
Generate exactly ${variantsCount} variants for each requested lifecycle channel and a modern, responsive HTML email template using Liquid syntax for personalization.
Return your output ONLY as a JSON object matching this structure:
{
  "subjectLines": ["Subject Variant 1", "Subject Variant 2", ...],
  "pushNotifications": ["Push Variant 1", "Push Variant 2", ...],
  "smsMessages": ["SMS Variant 1", "SMS Variant 2", ...],
  "inAppMessages": ["IAM Variant 1", "IAM Variant 2", ...],
  "contentCards": ["Content Card Variant 1", "Content Card Variant 2", ...],
  "emailTemplateHtml": "..."
}
Guidelines for the emailTemplateHtml:
- Build a beautiful, responsive HTML email template using inline CSS (avoid Tailwind or external CSS in the HTML).
- Use a sleek, modern design (e.g. dark container, card layout, colored buttons, rounded corners).
- Incorporate the requested Liquid personalization variables dynamically. For example, use:
  - {{ user.first_name | default: 'there' }}
  - {% if user.is_vip %}...{% else %}...{% endif %}
  - Or other variables checking if they exist before rendering.
- Make sure the HTML is complete, clean, and properly escapes braces where needed. Do not truncate the HTML code.`;

  const prompt = `Objective: ${objective}
Brand Voice / Tone: ${voice}
Variables to include: ${variables.join(', ')}
Number of copy variants requested: ${variantsCount}

Please draft a high-quality campaign following the JSON schema structure exactly.`;

  const result = await callGemini(prompt, apiKey, systemInstruction);

  if (result) {
    if (!result.subjectLines) {
      result.subjectLines = [result.subjectLineA, result.subjectLineB].filter(Boolean);
    }
    if (!result.pushNotifications) {
      result.pushNotifications = [result.pushNotificationA, result.pushNotificationB].filter(Boolean);
    }
    result.smsMessages = result.smsMessages || [];
    result.inAppMessages = result.inAppMessages || [];
    result.contentCards = result.contentCards || [];
    // Backward compatibility mappings
    result.subjectLineA = result.subjectLines[0] || '';
    result.subjectLineB = result.subjectLines[1] || '';
    result.pushNotificationA = result.pushNotifications[0] || '';
    result.pushNotificationB = result.pushNotifications[1] || '';
  }

  return result;
}

/**
 * Simulate A/B Test reviews using AI personas
 */
export async function simulateABTest({ objective, subjectA, subjectB, copyA, copyB }, apiKey) {
  if (!apiKey) {
    return getMockABTest(objective, subjectA, subjectB);
  }

  const systemInstruction = `You are a group of diverse consumer personas reviewing two marketing campaign variants (Variant A vs Variant B).
Analyze the copy, tone, and clickability for each variant and assign scores (0 to 100).
Return your output ONLY as a JSON object matching this structure:
{
  "personas": [
    {
      "name": "...",
      "role": "...",
      "scoreA": 85,
      "scoreB": 42,
      "critiqueA": "...",
      "critiqueB": "..."
    }
  ]
}
Generate exactly 3 diverse personas (e.g. a Deal-seeking discount hunter, a Busy working parent who ignores fluff, a Tech-savvy brand enthusiast). Make their critiques highly specific and realistic.`;

  const prompt = `Campaign Context: ${objective}
Variant A - Subject Line: "${subjectA}"
Variant A - Additional Body/Push Copy: "${copyA}"

Variant B - Subject Line: "${subjectB}"
Variant B - Additional Body/Push Copy: "${copyB}"

Review both variants and return the critiques in the JSON schema format.`;

  return callGemini(prompt, apiKey, systemInstruction);
}

// ==========================================
// MOCK DATA GENERATORS (FALLBACKS)
// ==========================================

function getMockCampaign(objective, voice, variables, variantsCount = 2) {
  const generateList = (baseList, count) => {
    const list = [...baseList];
    while (list.length < count) {
      const idx = list.length % baseList.length;
      const variation = list.length + 1;
      let text = baseList[idx];
      if (text.includes("!")) {
        text = text.replace("!", ` (Variant ${variation})!`);
      } else if (text.endsWith("?")) {
        text = text.substring(0, text.length - 1) + ` (Option ${variation})?`;
      } else {
        text = `${text} [Option ${variation}]`;
      }
      list.push(text);
    }
    return list.slice(0, count);
  };

  const generalSubjects = [
    "{{ user.first_name | default: 'You' }}, your member offer is ready",
    "{% if user.membership_tier == 'Gold' %}Gold access: early perks are open{% else %}New rewards are waiting for you{% endif %}",
    "Your account benefits were refreshed",
    "You are {{ user.points_needed | default: '100' }} points from the next reward",
    "A personalized offer based on {{ user.favorite_category | default: 'your favorites' }}",
    "Your next loyalty moment starts here",
    "A smarter way to use your rewards this week",
    "Members get first access today",
    "Your points balance: {{ user.points_balance | default: '0' }}",
    "A quick reminder before this offer closes"
  ];

  const generalPushes = [
    "Hi {{ user.first_name | default: 'there' }}, your personalized member offer is ready.",
    "Your rewards were refreshed. Tap to see what changed.",
    "{{ user.points_balance | default: '0' }} points are available in your account.",
    "Only {{ user.points_needed | default: '100' }} points to your next reward.",
    "{% if user.membership_tier == 'Gold' %}Gold perk unlocked: early access is live.{% else %}A new member perk is waiting.{% endif %}",
    "Tap to view offers matched to {{ user.favorite_category | default: 'your interests' }}.",
    "Limited-time loyalty bonus is live today.",
    "Your account has a new recommendation.",
    "Open to activate this week's member benefit.",
    "Reminder: your personalized offer is still available."
  ];

  const generalSms = [
    "{{ user.first_name | default: 'Hi' }}, your member offer is ready: {{ user.points_balance | default: '0' }} pts available. View in app.",
    "SmartCanvas: You are {{ user.points_needed | default: '100' }} pts from your next reward. Tap to see eligible actions.",
    "{% if user.membership_tier == 'Gold' %}Gold member early access is live.{% else %}A member-only offer is ready.{% endif %} Reply STOP to opt out.",
    "Your personalized rewards were refreshed. Check your app before this offer expires.",
    "New perk: offers based on {{ user.favorite_category | default: 'your preferences' }} are ready."
  ];

  const generalIam = [
    "Welcome back, {{ user.first_name | default: 'there' }}. Your best next offer is ready.",
    "{% if user.membership_tier == 'Gold' %}Gold benefit unlocked{% else %}Unlock your next member benefit{% endif %}",
    "You are {{ user.points_needed | default: '100' }} points away from the next reward.",
    "Recommended for you: {{ user.favorite_category | default: 'member favorites' }}",
    "Use your points today or save this offer for later."
  ];

  const generalCards = [
    "Reward path: {{ user.points_balance | default: '0' }} points earned, {{ user.points_needed | default: '100' }} to go.",
    "Member spotlight: Offers personalized to {{ user.favorite_category | default: 'your shopping history' }}.",
    "{% if user.is_vip %}VIP checklist: early access, bonus points, saved offer.{% else %}Starter checklist: activate offer, earn points, unlock next tier.{% endif %}",
    "Campaign card: tap to view the best next action for your account.",
    "Lifecycle reminder: your personalized benefit is still open."
  ];

  const subjectLines = generateList(generalSubjects, variantsCount);
  const pushNotifications = generateList(generalPushes, variantsCount);
  const smsMessages = generateList(generalSms, variantsCount);
  const inAppMessages = generateList(generalIam, variantsCount);
  const contentCards = generateList(generalCards, variantsCount);

  // General fallback mock data
  return {
    subjectLines,
    pushNotifications,
    smsMessages,
    inAppMessages,
    contentCards,
    subjectLineA: subjectLines[0] || '',
    subjectLineB: subjectLines[1] || '',
    pushNotificationA: pushNotifications[0] || '',
    pushNotificationB: pushNotifications[1] || '',
    emailTemplateHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 24px; color: #172026; }
    .card { background-color: #ffffff; border-radius: 10px; padding: 28px; max-width: 560px; margin: 0 auto; border: 1px solid #d9e2df; }
    .eyebrow { color: #0f766e; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; font-weight: bold; }
    h1 { font-size: 24px; margin: 10px 0 12px; color: #172026; }
    p { color: #52616b; line-height: 1.6; margin: 0 0 20px; }
    .tier-box { padding: 14px; border-radius: 8px; margin-bottom: 22px; font-weight: bold; }
    .btn { display: inline-block; background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { font-size: 12px; color: #77838c; margin-top: 28px; border-top: 1px solid #d9e2df; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">Member update</div>
    <h1>Hi {{ user.first_name | default: 'there' }}, your rewards are ready</h1>
    
    <p>We refreshed your account with benefits matched to your profile and recent activity.</p>
    
    {% if user.membership_tier == "Gold" %}
      <div class="tier-box" style="background-color: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;">
        Gold tier early access is available
      </div>
      <p>As a Gold member, you can access this offer before it opens to the full audience.</p>
    {% else %}
      <div class="tier-box" style="background-color: #ecfdf5; border: 1px solid #99f6e4; color: #0f766e;">
        Next reward progress
      </div>
      <p>You only need {{ user.points_needed | default: '100' }} more points to unlock your next member reward.</p>
    {% endif %}
    
    <a href="#" class="btn">View My Rewards</a>
    
    <div class="footer">
      Current Point Balance: {{ user.points_balance | default: '0' }} points.<br>
      Thank you for being with us!
    </div>
  </div>
</body>
</html>`
  };
}

function getMockABTest() {
  // General fallback critiques
  return {
    personas: [
      {
        name: "Jessica (Deal Hunter)",
        role: "28, shops promotions. Always looking for promo codes, opens coupon folders daily.",
        scoreA: 85,
        scoreB: 50,
        critiqueA: "This is clear. Seeing 'Exclusive Offer' and my first name means there is something in it for me. I'll open it to see if there's a coupon code.",
        critiqueB: "A bit too vague. 'Gold Tier' is nice, but if I'm not a Gold member, I feel ignored. The other fallback is too generic to care about."
      },
      {
        name: "David (Busy Executive)",
        role: "42, filters emails aggressively. Values brevity, dislikes clickbait.",
        scoreA: 30,
        scoreB: 75,
        critiqueA: "Subject lines that call me 'VIP' or have emojis get archived immediately. I don't have time for hype.",
        critiqueB: "I like this one because it's targeted. If I am in Gold Tier, I want to know my exclusive rewards. It tells me what the email is about without flashing lights."
      },
      {
        name: "Elena (Casual Customer)",
        role: "50, checking email occasionally. Prefers friendly and helpful messaging.",
        scoreA: 78,
        scoreB: 70,
        critiqueA: "This is very friendly! Having my name in the subject line makes me feel remembered by the brand.",
        critiqueB: "It's decent. I'm not sure what my membership tier is, so I might ignore it, but if it has my name it is nice."
      }
    ]
  };
}
