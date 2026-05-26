/**
 * Service client for Gemini API integrations.
 * Works client-side using fetch.
 * Provides rich mock fallbacks if no API Key is supplied.
 */

// Model to use
const MODEL_NAME = 'gemini-3.5-flash';

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
export async function generateCampaign({ objective, voice, variables }, apiKey) {
  if (!apiKey) {
    // Return rich simulated mock data contextually
    return getMockCampaign(objective, voice, variables);
  }

  const systemInstruction = `You are an expert lifecycle email marketer and Braze HTML developer.
Generate subject lines, push notifications, and a modern, responsive HTML email template using Liquid syntax for personalization.
Return your output ONLY as a JSON object matching this structure:
{
  "subjectLineA": "...",
  "subjectLineB": "...",
  "pushNotificationA": "...",
  "pushNotificationB": "...",
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

Please draft a high-quality campaign following the JSON schema structure exactly.`;

  return callGemini(prompt, apiKey, systemInstruction);
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

function getMockCampaign(objective, voice, variables) {
  const lowercaseObj = objective.toLowerCase();
  
  // Custom mock data for Dairy Queen / Blizzard
  if (lowercaseObj.includes('dairy queen') || lowercaseObj.includes('blizzard') || lowercaseObj.includes('dq')) {
    return {
      subjectLineA: "🍦 Free Blizzard Alert: We miss you, {{ user.first_name | default: 'friend' }}!",
      subjectLineB: "{% if user.favorite_flavor %}Your favorite {{ user.favorite_flavor }} Blizzard is waiting!{% else %}Craving something sweet? Free Blizzard inside!{% endif %}",
      pushNotificationA: "Hey {{ user.first_name | default: 'there' }}, it's been 30 days! Come back and get a FREE Blizzard of your choice.",
      pushNotificationB: "🍦 Sweet deal: Get a FREE Blizzard on us! Check your email for details.",
      emailTemplateHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
    .card { background-color: #1e293b; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; border: 1px solid #334155; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: #e11d48; margin-bottom: 20px; text-transform: uppercase; }
    h1 { font-size: 22px; margin-bottom: 15px; color: #f8fafc; }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 25px; }
    .coupon { background-color: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 8px; padding: 15px; font-weight: bold; font-size: 18px; color: #818cf8; margin-bottom: 25px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🍧 Dairy Queen</div>
    <h1>Hey {{ user.first_name | default: 'Sweet Tooth' }},</h1>
    
    <p>It's been a while since your last visit! To help you cool off, we've loaded a coupon for a <strong>FREE Small Blizzard</strong> directly to your loyalty account.</p>
    
    {% if user.favorite_flavor %}
      <div class="coupon">FREE {{ user.favorite_flavor | uppercase }} BLIZZARD</div>
      <p>We know you love <strong>{{ user.favorite_flavor }}</strong>, but feel free to choose any flavor you're craving!</p>
    {% else %}
      <div class="coupon">FREE SMALL BLIZZARD</div>
      <p>Whether you're an Oreo Fanatic or a Cookie Dough lover, the choice is yours!</p>
    {% endif %}

    {% if user.membership_tier == "Gold" %}
      <p style="color: #fbbf24; font-size: 14px; font-weight: bold;">⭐ Special Gold Member Benefit: We've also added 100 bonus points to your wallet!</p>
    {% endif %}
    
    <a href="#" class="btn">Claim Your Blizzard</a>
    
    <div class="footer">
      This offer is valid for 14 days at participating locations.<br>
      Point Balance: {{ user.points_balance | default: '0' }} points.
    </div>
  </div>
</body>
</html>`
    };
  }

  // General fallback mock data
  return {
    subjectLineA: "🎯 Exclusive Offer for {{ user.first_name | default: 'our VIPs' }}!",
    subjectLineB: "{% if user.membership_tier == 'Gold' %}💎 VIP Exclusive: Premium Rewards Inside{% else %}Hey {{ user.first_name | default: 'there' }}, see what's new!{% endif %}",
    pushNotificationA: "Hi {{ user.first_name | default: 'there' }}! We have a new offer tailored just for you. Open to reveal.",
    pushNotificationB: "🚨 Don't miss out on your member benefits! Check out your rewards today.",
    emailTemplateHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background-color: #0b0b0f; margin: 0; padding: 20px; color: #f8fafc; }
    .card { background-color: #12121a; border-radius: 16px; padding: 30px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .logo { font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 25px; }
    h1 { font-size: 22px; margin-bottom: 15px; color: #ffffff; }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 25px; }
    .tier-box { padding: 12px; border-radius: 8px; margin-bottom: 25px; font-weight: bold; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); }
    .footer { font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">SMARTCANVAS CO.</div>
    <h1>Special Update for {{ user.first_name | default: 'our Member' }}</h1>
    
    <p>We are thrilled to share an exclusive update on your account benefits and personal offers.</p>
    
    {% if user.membership_tier == "Gold" %}
      <div class="tier-box" style="background-color: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); color: #fbbf24;">
        👑 GOLD TIER EXCLUSIVE BENEFIT
      </div>
      <p>As a Gold Member, you have access to free express shipping and double points on all orders this week!</p>
    {% else %}
      <div class="tier-box" style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8;">
        ⭐ STANDARD TIER BENEFITS
      </div>
      <p>Want to unlock Gold Tier? You only need {{ user.points_needed | default: '150' }} more points to upgrade and get free shipping!</p>
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

function getMockABTest(objective, subjectA, subjectB) {
  const lowercaseObj = objective.toLowerCase();
  const isDairyQueen = lowercaseObj.includes('dairy queen') || lowercaseObj.includes('blizzard') || lowercaseObj.includes('dq');
  
  if (isDairyQueen) {
    return {
      personas: [
        {
          name: "Sarah (Busy Parent)",
          role: "34, mother of two. Has limited time, scans notifications quickly, looks for high-value family treats.",
          scoreA: 92,
          scoreB: 68,
          critiqueA: "Variant A says 'Free Blizzard Alert' right at the front. This caught my attention instantly because my kids love Blizzards and 'Free' is an easy win for a family treat. I will definitely open this email.",
          critiqueB: "If the email is about a flavor I don't buy, I might skip it. The personalization 'Your favorite favorite_flavor Blizzard' is nice, but Variant A's directness and simplicity ('Free Blizzard Alert') is much more compelling for a busy day."
        },
        {
          name: "Marcus (College Student)",
          role: "21, budget-conscious student. Highly responsive to free food, uses food apps, browses late at night.",
          scoreA: 88,
          scoreB: 94,
          critiqueA: "Love the free Blizzard offer, but the subject line feels a little generic. 'We miss you' feels like typical marketing guilt. I'd open it, but mainly just because it says 'free'.",
          critiqueB: "This is awesome. It checks my favorite flavor (which is Chocolate Chip Cookie Dough). Seeing my favorite flavor combined with 'free' is an instant open. If it falls back to 'Free Blizzard inside', it still works, but favorite flavor makes it 10/10."
        },
        {
          name: "Robert (Retired Professional)",
          role: "62, loyal DQ customer. Values loyalty points, reads his email on a tablet in the morning, dislikes hype.",
          scoreA: 55,
          scoreB: 72,
          critiqueA: "Subject lines starting with emojis like 🍦 feel a bit childish and cluttered to me. I see a lot of spam like this. The word 'Alert' also feels unnecessarily dramatic for ice cream.",
          critiqueB: "This subject line is much calmer. It directly states my favorite flavor or offers a straightforward 'Free Blizzard inside' message. It reads clean, looks more trustworthy, and is something I'd actually tap on."
        }
      ]
    };
  }

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
