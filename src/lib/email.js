import { env, isWorkerConfigured } from './env'

async function postEmail(payload) {
  if (!isWorkerConfigured) return { skipped: true }

  const response = await fetch(env.workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok || result?.error) {
    throw new Error(result?.error || 'Email send failed')
  }

  return result
}

function escapeHtml(value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function applicationShell({ title, intro, accent = '#2F6FED', details = [], note = '' }) {
  return `
    <div style="margin:0;padding:28px 16px;background:#F4F7FB;font-family:Arial,sans-serif;color:#182033">
      <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #DEE6F3;border-radius:24px;overflow:hidden;box-shadow:0 12px 34px rgba(19,35,79,0.08)">
        <div style="padding:24px 28px;background:linear-gradient(135deg, ${accent} 0%, #101827 100%);color:#FFFFFF">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.72">Recruitment</div>
          <div style="font-size:28px;font-weight:700;line-height:1.12;letter-spacing:-0.03em;margin-top:10px">${escapeHtml(title)}</div>
          <div style="font-size:14px;line-height:1.75;opacity:0.9;margin-top:12px">${escapeHtml(intro)}</div>
        </div>
        <div style="padding:28px">
          <div style="padding:18px;border:1px solid #D9E1F2;border-radius:18px;background:#F7F9FC">
            ${details
              .map(
                (row, index) => `
              <div style="${index < details.length - 1 ? 'padding-bottom:14px;border-bottom:1px solid #E7ECF5;margin-bottom:14px;' : ''}">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A8499;margin-bottom:6px">${escapeHtml(row.label)}</div>
                <div style="font-size:14px;line-height:1.65;color:#182033">${row.html ? row.value : escapeHtml(row.value)}</div>
              </div>
            `,
              )
              .join('')}
          </div>
          ${note ? `<div style="margin-top:16px;font-size:14px;line-height:1.75;color:#44506A">${escapeHtml(note)}</div>` : ''}
        </div>
      </div>
    </div>
  `
}

export async function sendCandidateApplicationConfirmation({ candidateEmail, candidateName, roleTitle, applicationRef }) {
  return postEmail({
    type: 'custom_email',
    data: {
      to: candidateEmail,
      from: 'DH Website Services HR <HR@dhwebsiteservices.co.uk>',
      subject: `Application received: ${roleTitle}`,
      html: applicationShell({
        title: `We have received your application for ${roleTitle}`,
        intro: `Thanks ${candidateName || ''}, your application is now with the recruitment team.`,
        accent: '#0F9D7A',
        details: [
          { label: 'Role', value: roleTitle },
          { label: 'Application reference', value: applicationRef || 'Pending' },
          {
            label: 'Candidate portal',
            value: `<a href="${env.portalBaseUrl}" style="color:#0F9D7A;text-decoration:none;font-weight:700">Open your candidate portal</a>`,
            html: true,
          },
        ],
        note: 'You can sign in to the candidate portal at any time to update your profile and follow recruitment updates.',
      }),
    },
  })
}

export async function sendRecruitingNewApplicationNotification({ roleTitle, applicationRef, candidateName, candidateEmail, candidatePhone, location, currentRole }) {
  return postEmail({
    type: 'custom_email',
    data: {
      to: 'hr@dhwebsiteservices.co.uk',
      from: 'DH Website Services HR <HR@dhwebsiteservices.co.uk>',
      subject: `New application received: ${roleTitle}`,
      html: applicationShell({
        title: `New candidate application for ${roleTitle}`,
        intro: 'A new application has been submitted through the candidate portal and should now be visible in the staff portal recruitment workspace.',
        accent: '#2F6FED',
        details: [
          { label: 'Candidate', value: candidateName || candidateEmail },
          { label: 'Email', value: candidateEmail || 'Not provided' },
          { label: 'Phone', value: candidatePhone || 'Not provided' },
          { label: 'Location', value: location || 'Not provided' },
          { label: 'Current role', value: currentRole || 'Not provided' },
          { label: 'Application reference', value: applicationRef || 'Pending' },
        ],
        note: 'Review this application in the staff portal recruitment area.',
      }),
    },
  })
}
