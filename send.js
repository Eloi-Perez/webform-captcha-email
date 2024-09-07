import nodemailer from 'nodemailer'
import { verifySolution } from 'altcha-lib'
import domains from './domains.json' with {type: 'json'}

const transporter = () => nodemailer.createTransport({
  // service: "Zoho",
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_FROM_PASS
  }
})

const escapeHTML = str =>
  str.replace(
    /[&<>'"]/g,
    tag =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  )

async function routes(fastify, options) {
  fastify.post('/send-email', async (request, reply) => {
    const name = escapeHTML(request.body.name || "")
    const email = escapeHTML(request.body.email || "")
    const phone = escapeHTML(request.body.phone || "")
    const message = escapeHTML(request.body.message || "")
    // const subject = escapeHTML(request.body.subject || "")
    // const availability = escapeHTML(request.body.availability || "")
    const origin = request.body.origin
    // console.warn(origin)

    // Validate captcha payload
    const payload = request.body.altchaPayload
    if (!payload) {
      return reply.code(400).send({ error: 'Invalid captcha payload' });
    }
    if (await verifySolution(payload, process.env.HMACKEY)) {
      console.log('VERIFIED ALTCHA.')
    } else {
      console.log('INVALID ALTCHA.')
      return reply.code(400).send({ error: 'Captcha check failed' })
    }

    const mailData = {
      from: `${origin} Webform<${process.env.EMAIL_FROM}>`,
      to: domains[origin].email,
      replyTo: {
        name: name,
        address: email,
      },
      subject: `Webform message from ${origin}>`,
      text: message,
      html: /*html*/`
<!DOCTYPE HTML
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <title></title>
</head>
<body style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%; background-color: #e9cd2a;">
    <table
        style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; border: 0; border: 0;"
        width="100%" cellspacing="0" cellpadding="0">
        <tbody>
            <tr>
                <td style="font-family: sans-serif; font-size: 16px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;"
                    valign="top" width="580">
                    <div
                        style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table
                            style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #fff; border-radius: 3px; width: 100%;"
                            width="100%">
                            <tbody>
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 16px; vertical-align: top; box-sizing: border-box; padding: 20px;"
                                        valign="top">
                                        <table
                                            style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; border: 0;"
                                            width="100%" cellspacing="0" cellpadding="0">
                                            <tbody>
                                                <tr>
                                                    <td style="font-family: sans-serif; font-size: 16px; vertical-align: top;"
                                                        valign="top">
                                                        <p
                                                            style="font-family: sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 30px; text-align: right;">
                                                            ${name}<br />
                                                            <a href="mailto:${email}">${email}</a><br />
                                                            <a href="tel:${phone}">${phone}</a><br />
                                                        </p>
                                                        <p
                                                            style="font-family: sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 15px;">
                                                            ${message}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
            `
    }
    const emailTransporter = await transporter()
    if (!emailTransporter) return reply.code(500).send({ error: 'emailTransporter error' })

    await emailTransporter.sendMail(mailData, function (err, info) {
      if (err) {
        console.log(err)
        return reply.code(500).send({ error: err })
      } else {
        console.log(info)
    return reply.send({ message: 'Sent!' })
      }
    })
  })
}


export default routes;