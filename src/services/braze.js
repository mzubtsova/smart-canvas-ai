/**
 * Service client for Braze REST API integrations.
 * Performs client-side POST requests to create email templates.
 * Provides a mock fallback for interview demos if no credentials are set.
 */

export async function exportTemplateToBraze({ templateName, subject, body, apiKey, endpoint }) {
  // If no API key, run in simulated/demo mode
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API network latency
    return {
      success: true,
      simulated: true,
      templateId: `email_template_sim_${Math.random().toString(36).substring(2, 11)}`
    };
  }

  // Real Braze API call
  // Clean endpoint format to avoid double HTTPS prefixes
  let cleanEndpoint = endpoint.trim().replace(/^https?:\/\//i, '');
  const url = `https://${cleanEndpoint}/templates/email/create`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      template_name: templateName,
      subject: subject,
      body: body,
      should_inline_css: true // Standard practice to inline CSS in marketing emails
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      `Braze API Error! Status: ${response.status} (Make sure your key has templates.email.create permission)`
    );
  }

  const data = await response.json();
  
  if (data.errors || data.message === "errors") {
    const errorsMsg = data.errors ? JSON.stringify(data.errors) : "Unknown validation errors";
    throw new Error(`Braze API Validation Failed: ${errorsMsg}`);
  }

  return {
    success: true,
    simulated: false,
    templateId: data.email_template_id
  };
}
