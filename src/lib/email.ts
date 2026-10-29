import "server-only";
import { Resend } from "resend";

// Transactional email through Resend. Without RESEND_API_KEY (local dev, or before the domain is set up)
// emails are printed to the server log instead, so flows can still be tested.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Studyverse <noreply@studyverse.devappland.com>";

export const emailEnabled = Boolean(resend);

type Email = { to: string; subject: string; heading: string; text: string; action: { label: string; url: string } };

// Names come from user input, so everything interpolated into the HTML is escaped.
const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render(email: Email) {
  const heading = escape(email.heading);
  const text = escape(email.text);
  const action = { label: escape(email.action.label), url: escape(email.action.url) };
  // Plain, table-free markup: renders well in Gmail, Outlook and mobile clients.
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f5ef;font-family:Helvetica,Arial,sans-serif;color:#222824">
<div style="max-width:520px;margin:0 auto;padding:40px 24px">
  <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 32px">Studyverse<span style="color:#d97745">.</span></p>
  <h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;line-height:1.2;margin:0 0 16px">${heading}</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 28px">${text}</p>
  <a href="${action.url}" style="display:inline-block;background:#193d35;color:#f7f5ef;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:15px">${action.label}</a>
  <p style="font-size:13px;line-height:1.6;color:#66726c;margin:32px 0 0">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><span style="word-break:break-all">${action.url}</span></p>
  <p style="font-size:13px;line-height:1.6;color:#66726c;margin:24px 0 0">Tu n'es pas à l'origine de cette demande ? Ignore simplement cet e-mail.</p>
</div></body></html>`;
}

export async function sendEmail(email: Email) {
  const plain = `${email.heading}\n\n${email.text}\n\n${email.action.label} : ${email.action.url}`;
  if (!resend) {
    console.info(`[email] (not sent, RESEND_API_KEY missing) to=${email.to} subject="${email.subject}"\n${plain}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to: email.to, subject: email.subject, html: render(email), text: plain });
  if (error) console.error("[email] send failed", error.message);
}
