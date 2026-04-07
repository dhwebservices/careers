import { env } from './env'

async function postEmail(payload) {
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

function shell({ title, intro, details = [], note = '' }) {
  return `
    <div style="margin:0;padding:28px 16px;background:#F4F7FB;font-family:Arial,sans-serif;color:#182033">
      <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #DEE6F3;border-radius:24px;overflow:hidden;box-shadow:0 12px 34px rgba(19,35,79,0.08)">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#2F6FED 0%,#101827 100%);color:#FFFFFF">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.72">Interview confirmation</div>
          <div style="font-size:28px;font-weight:700;line-height:1.12;letter-spacing:-0.03em;margin-top:10px">${title}</div>
          <div style="font-size:14px;line-height:1.75;opacity:0.9;margin-top:12px">${intro}</div>
        </div>
        <div style="padding:28px">
          <div style="padding:18px;border:1px solid #D9E1F2;border-radius:18px;background:#F7F9FC">
            ${details.map((row, index) => `
              <div style="${index < details.length - 1 ? 'padding-bottom:14px;border-bottom:1px solid #E7ECF5;margin-bottom:14px;' : ''}">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A8499;margin-bottom:6px">${row.label}</div>
                <div style="font-size:14px;line-height:1.65;color:#182033">${row.value}</div>
              </div>
            `).join('')}
          </div>
          ${note ? `<div style="margin-top:16px;font-size:14px;line-height:1.75;color:#44506A">${note}</div>` : ''}
        </div>
      </div>
    </div>
  `
}

export async function sendCandidateInterviewConfirmation({ candidateEmail, candidateName, roleTitle, startAtLabel, mode, location, managerName, notes }) {
  return postEmail({
    type: 'custom_email',
    data: {
      to: candidateEmail,
      from: 'DH Website Services HR <HR@dhwebsiteservices.co.uk>',
      subject: `Interview confirmed: ${roleTitle} — ${startAtLabel}`,
      html: shell({
        title: `Your interview for ${roleTitle} is confirmed`,
        intro: `Thanks ${candidateName || ''}, your chosen interview slot is now booked.`,
        details: [
          { label: 'Role', value: roleTitle },
          { label: 'Date and time', value: startAtLabel },
          { label: 'Format', value: mode || 'To be confirmed' },
          { label: 'Meeting details', value: location || 'We will send this shortly.' },
          { label: 'Hiring manager', value: managerName || 'DH Website Services' },
        ],
        note: notes || '',
      }),
    },
  })
}

export async function sendHiringManagerInterviewConfirmation({ managerEmail, managerName, candidateName, roleTitle, startAtLabel, mode, location, notes }) {
  return postEmail({
    type: 'custom_email',
    data: {
      to: managerEmail,
      from: 'DH Website Services HR <HR@dhwebsiteservices.co.uk>',
      subject: `Candidate booked interview: ${candidateName} — ${roleTitle}`,
      html: shell({
        title: `${candidateName} booked an interview`,
        intro: 'A candidate has chosen one of the interview slots you published.',
        details: [
          { label: 'Candidate', value: candidateName },
          { label: 'Role', value: roleTitle },
          { label: 'Date and time', value: startAtLabel },
          { label: 'Format', value: mode || 'To be confirmed' },
          { label: 'Meeting details', value: location || 'We will send this shortly.' },
          { label: 'Hiring manager', value: managerName || managerEmail },
        ],
        note: notes || '',
      }),
    },
  })
}
