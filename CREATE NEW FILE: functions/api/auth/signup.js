export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return Response.json(
        { success: false, message: 'Email required.' },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return Response.json(
        { success: false, message: 'Invalid email format.' },
        { status: 400 }
      );
    }

    const verifyToken = crypto.randomUUID();
    const requestUrl = new URL(context.request.url);
    const origin = requestUrl.origin;

    const verifyUrl =
      origin +
      '/api/auth/verify?token=' +
      encodeURIComponent(verifyToken) +
      '&email=' +
      encodeURIComponent(email);

    const serviceReplyEmail = 'cybercrowd_services@yahoo.com';

    const fromEmail =
      context.env.CC_EMAIL_FROM ||
      'CyberCrowd <onboarding@cybercrowd.net>';

    const postmarkToken = context.env.POSTMARK_API_KEY || '';

    const emailSubject = 'Verify your CyberCrowd free entry';

    const emailText = [
      'CyberCrowd Free Entry Verification',
      '',
      'You requested free CyberCrowd access.',
      '',
      'Click this verification link to continue:',
      verifyUrl,
      '',
      'If you did not request this, ignore this email.',
      '',
      'CyberCrowd Services:',
      serviceReplyEmail
    ].join('\n');

    const emailHtml = `
<div style="font-family:Arial,sans-serif;background:#050505;color:white;padding:28px;">
  <div style="max-width:620px;margin:0 auto;border:1px solid rgba(0,255,255,.35);border-radius:22px;padding:26px;background:rgba(5,10,18,.96);">
    <h1 style="color:#00ffff;letter-spacing:2px;">CyberCrowd Free Entry</h1>
    <p style="line-height:1.7;opacity:.88;">You requested free CyberCrowd access. Click the verification button below to continue.</p>
    <p>
      <a href="${verifyUrl}" style="display:inline-block;padding:16px 22px;border-radius:16px;background:linear-gradient(90deg,#00ffff,#00ffaa);color:black;font-weight:bold;text-decoration:none;letter-spacing:1px;">
        VERIFY CYBERCROWD ENTRY
      </a>
    </p>
    <p style="line-height:1.7;opacity:.72;font-size:13px;">
      If the button does not work, copy and paste this link:<br>
      <span style="color:#00ffaa;word-break:break-all;">${verifyUrl}</span>
    </p>
    <p style="margin-top:24px;font-size:12px;opacity:.62;">CyberCrowd Services: ${serviceReplyEmail}</p>
  </div>
</div>
`;

    console.log('CYBERCROWD FREE ENTRY REQUEST:', email);
    console.log('CYBERCROWD VERIFY TOKEN:', verifyToken);
    console.log('CYBERCROWD VERIFY URL:', verifyUrl);

    let emailDelivery = 'not_configured';

    if (postmarkToken) {
      const sendResponse = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': postmarkToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          From: fromEmail,
          To: email,
          ReplyTo: serviceReplyEmail,
          Subject: emailSubject,
          HtmlBody: emailHtml,
          TextBody: emailText,
          MessageStream: 'welcome-to-cybercrowd-where-we-belong'
        })
      });

      const sendData = await sendResponse.json().catch(() => ({}));

      if (!sendResponse.ok) {
        console.error('CYBERCROWD EMAIL SEND FAILURE:', sendData);

        return Response.json(
          {
            success: false,
            message: 'Verification created, but email delivery failed.',
            email,
            status: 'email_delivery_failed',
            verifyToken,
            verifyUrl,
            emailDelivery: 'failed',
            details: sendData
          },
          { status: 502 }
        );
      }

      emailDelivery = 'sent';
      console.log('CYBERCROWD VERIFY EMAIL SENT:', email);
    }

    return Response.json(
      {
        success: true,
        status: 'pending_verification',
        message:
          emailDelivery === 'sent'
            ? 'Verification email sent. Check your inbox.'
            : 'Verification created. Email API key is not configured yet.',
        email,
        verifyToken,
        verifyUrl,
        emailDelivery,
        serviceReplyEmail
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CYBERCROWD SIGNUP ERROR:', error);

    return Response.json(
      { success: false, message: 'Continuity enrollment failure.' },
      { status: 500 }
    );
  }
}
