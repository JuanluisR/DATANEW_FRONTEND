package com.datanew.datanew.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${alert.notification.from-email:noreply@datanew.com}")
    private String fromEmail;

    @Value("${alert.notification.from-name:DataNew Weather}")
    private String fromName;

    /**
     * Enviar correo de alerta con plantilla HTML
     */
    @Async
    public void sendAlertEmail(String to, String alertName, String stationName,
                                String variable, String operator, double threshold,
                                String unit, double currentValue) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject("Alerta: " + alertName + " - DataNew Weather");

            String html = buildAlertHtml(alertName, stationName, variable, operator,
                    threshold, unit, currentValue);
            helper.setText(html, true);

            mailSender.send(message);
            logger.info("Alert email sent to {} for alert '{}'", to, alertName);
        } catch (MessagingException e) {
            logger.error("Failed to send alert email to {}: {}", to, e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error sending email to {}: {}", to, e.getMessage());
        }
    }

    private String buildAlertHtml(String alertName, String stationName, String variable,
                                   String operator, double threshold, String unit, double currentValue) {
        String operatorSymbol = switch (operator) {
            case ">" -> "mayor que";
            case "<" -> "menor que";
            case ">=" -> "mayor o igual que";
            case "<=" -> "menor o igual que";
            case "==" -> "igual a";
            default -> operator;
        };

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f3f4f6;">
                <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:24px 32px;text-align:center;">
                        <h1 style="color:#ffffff;margin:0;font-size:24px;">Alerta Activada</h1>
                        <p style="color:#fecaca;margin:8px 0 0;font-size:14px;">DataNew Weather</p>
                    </div>

                    <!-- Content -->
                    <div style="padding:32px;">
                        <h2 style="color:#1f2937;margin:0 0 16px;font-size:20px;">%s</h2>

                        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
                            <p style="margin:0;color:#991b1b;font-size:16px;">
                                <strong>%s</strong> es <strong>%s</strong> <strong>%.2f %s</strong>
                            </p>
                            <p style="margin:12px 0 0;color:#dc2626;font-size:24px;font-weight:bold;">
                                Valor actual: %.2f %s
                            </p>
                        </div>

                        <table style="width:100%%;border-collapse:collapse;margin-bottom:20px;">
                            <tr>
                                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Estaci&oacute;n</td>
                                <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #e5e7eb;">Variable</td>
                                <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #e5e7eb;">Umbral</td>
                                <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">%s %.2f %s</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Footer -->
                    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">Este correo fue enviado autom&aacute;ticamente por DataNew Weather.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                alertName,
                variable, operatorSymbol, threshold, unit,
                currentValue, unit,
                stationName,
                variable,
                operatorSymbol, threshold, unit
        );
    }
}
