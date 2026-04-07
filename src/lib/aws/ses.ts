import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
    region: process.env.SES_REGION || process.env.AWS_REGION || "us-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export async function sendEmail({
    to,
    subject,
    html,
    fromName,
    fromEmail,
}: {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    fromEmail?: string;
}) {
    // AWS SES requires the sender to be a verified domain/address.
    // If the default verified address is sales@basalthq.com, we can use the brand name with the verified email address.
    const defaultFrom = process.env.SES_FROM_ADDRESS || "BasaltCRM <sales@basalthq.com>";
    
    // Extract the raw email address from defaultFrom (e.g., "BasaltCRM <sales@basalthq.com>" -> "sales@basalthq.com")
    let verifiedEmail = defaultFrom;
    const match = defaultFrom.match(/<([^>]+)>/);
    if (match) {
        verifiedEmail = match[1];
    }

    // Set the display name to the requested fromName, but enforce the verified email
    const source = fromName ? `"${fromName}" <${verifiedEmail}>` : defaultFrom;

    const command = new SendEmailCommand({
        Source: source,
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: "UTF-8",
            },
            Body: {
                Html: {
                    Data: html,
                    Charset: "UTF-8",
                },
            },
        },
        ReplyToAddresses: fromEmail ? [fromEmail] : undefined,
    });

    return await sesClient.send(command);
}
