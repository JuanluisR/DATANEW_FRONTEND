package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Alert;
import com.datanew.datanew.models.entities.DataStation;
import com.datanew.datanew.repositories.AlertRepository;
import com.datanew.datanew.repositories.DataStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AlertNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(AlertNotificationService.class);

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private DataStationRepository dataStationRepository;

    @Autowired
    private EmailService emailService;

    @Value("${alert.notification.cooldown-minutes:15}")
    private int cooldownMinutes;

    @Value("${alert.notification.email-resend-minutes:45}")
    private int emailResendMinutes;

    /**
     * Check all active alerts for a station when new data arrives
     */
    public void checkAlerts(DataStation data) {
        if (data == null || data.getId_estacion() == null) return;

        String stationId = data.getId_estacion();
        logger.info("Checking alerts for station: {}", stationId);

        List<Alert> activeAlerts = alertRepository.findByIdEstacionAndIsActiveTrue(stationId);

        if (activeAlerts.isEmpty()) {
            logger.info("No active alerts found for station: {}", stationId);
            return;
        }

        logger.info("Found {} active alert(s) for station: {}", activeAlerts.size(), stationId);

        for (Alert alert : activeAlerts) {
            try {
                processAlert(alert, data);
            } catch (Exception e) {
                logger.error("Error processing alert '{}' (id={}): {}", alert.getNombreAlerta(), alert.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Scheduled task: every 7 minutes, check all active alerts against the latest data
     */
    @Scheduled(fixedRate = 420000) // 7 minutes = 420,000 ms
    public void scheduledAlertCheck() {
        logger.info("Running scheduled alert check...");

        List<Alert> activeAlerts = alertRepository.findByIsActiveTrue();
        if (activeAlerts.isEmpty()) {
            logger.info("No active alerts to check");
            return;
        }

        // Get unique station IDs
        List<String> stationIds = activeAlerts.stream()
                .map(Alert::getIdEstacion)
                .distinct()
                .collect(Collectors.toList());

        logger.info("Checking {} active alert(s) across {} station(s)", activeAlerts.size(), stationIds.size());

        for (String stationId : stationIds) {
            try {
                Optional<DataStation> latestData = dataStationRepository.findLatestByIdEstacion(stationId);
                if (latestData.isEmpty()) {
                    logger.info("No data found for station: {}", stationId);
                    continue;
                }

                DataStation data = latestData.get();
                List<Alert> stationAlerts = activeAlerts.stream()
                        .filter(a -> stationId.equals(a.getIdEstacion()))
                        .collect(Collectors.toList());

                for (Alert alert : stationAlerts) {
                    try {
                        checkAndUpdateAlertValue(alert, data);
                    } catch (Exception e) {
                        logger.error("Error in scheduled check for alert '{}' (id={}): {}",
                                alert.getNombreAlerta(), alert.getId(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.error("Error fetching latest data for station {}: {}", stationId, e.getMessage());
            }
        }

        logger.info("Scheduled alert check completed");
    }

    /**
     * Check alert against data and always update the last registered value
     */
    private void checkAndUpdateAlertValue(Alert alert, DataStation data) {
        Float currentValue = getVariableValue(alert.getVariable(), data);
        if (currentValue == null || currentValue.isNaN()) return;

        boolean conditionMet = evaluateCondition(currentValue.doubleValue(), alert.getOperador(), alert.getValorUmbral());

        // Always update the last value so the frontend can show current state
        alert.setUltimoValorRegistrado(currentValue.doubleValue());

        if (conditionMet) {
            logger.info("SCHEDULED CHECK - Alert '{}' BREACHED: {} = {} {} {} {}",
                    alert.getNombreAlerta(), alert.getVariable(), currentValue,
                    alert.getOperador(), alert.getValorUmbral(), alert.getUnidad());
            alert.setUltimaActivacion(LocalDateTime.now());
            alert.setVecesActivada((alert.getVecesActivada() != null ? alert.getVecesActivada() : 0) + 1);

            if (shouldResendEmail(alert)) {
                logger.info("SCHEDULED - Sending/resending email for alert '{}'", alert.getNombreAlerta());
                sendAlertEmails(alert, currentValue.doubleValue());
            } else {
                logger.info("SCHEDULED - Alert '{}' email cooldown active (last email: {}), next resend after {} min",
                        alert.getNombreAlerta(), alert.getUltimoEmailEnviado(), emailResendMinutes);
            }
        }

        alertRepository.save(alert);
    }

    private void processAlert(Alert alert, DataStation data) {
        Float currentValue = getVariableValue(alert.getVariable(), data);
        if (currentValue == null || currentValue.isNaN()) {
            logger.info("Alert '{}': variable '{}' has no value in station data, skipping", alert.getNombreAlerta(), alert.getVariable());
            return;
        }

        boolean conditionMet = evaluateCondition(currentValue.doubleValue(), alert.getOperador(), alert.getValorUmbral());
        logger.info("Alert '{}': {} = {} {} {} {} -> condition {}",
                alert.getNombreAlerta(), alert.getVariable(), currentValue,
                alert.getOperador(), alert.getValorUmbral(), alert.getUnidad(),
                conditionMet ? "MET" : "NOT MET");

        // Always update the last registered value
        alert.setUltimoValorRegistrado(currentValue.doubleValue());

        if (conditionMet) {
            boolean firstTrigger = !isInCooldown(alert);

            if (firstTrigger) {
                logger.info("ALERT TRIGGERED - Alert: '{}', Station: {}, Variable: {}, Value: {}, Threshold: {} {}",
                        alert.getNombreAlerta(), alert.getIdEstacion(), alert.getVariable(),
                        currentValue, alert.getValorUmbral(), alert.getUnidad());

                alert.setUltimaActivacion(LocalDateTime.now());
                alert.setVecesActivada((alert.getVecesActivada() != null ? alert.getVecesActivada() : 0) + 1);
                sendAlertEmails(alert, currentValue.doubleValue());
            } else if (shouldResendEmail(alert)) {
                logger.info("RESENDING EMAIL - Alert '{}' still breached after {} min, resending emails",
                        alert.getNombreAlerta(), emailResendMinutes);
                sendAlertEmails(alert, currentValue.doubleValue());
            } else {
                logger.info("Alert '{}' is in email cooldown (last email: {}), skipping",
                        alert.getNombreAlerta(), alert.getUltimoEmailEnviado());
            }
        }

        alertRepository.save(alert);
    }

    /**
     * Send email notifications to all configured recipients
     */
    private void sendAlertEmails(Alert alert, double currentValue) {
        if (Boolean.TRUE.equals(alert.getNotificarEmail()) && alert.getEmails() != null && !alert.getEmails().isBlank()) {
            String[] recipients = alert.getEmails().split(",");
            String varLabel = getVariableLabel(alert.getVariable());
            for (String email : recipients) {
                String trimmed = email.trim();
                if (!trimmed.isEmpty()) {
                    emailService.sendAlertEmail(
                            trimmed,
                            alert.getNombreAlerta(),
                            alert.getNombreEstacion() != null ? alert.getNombreEstacion() : alert.getIdEstacion(),
                            varLabel,
                            alert.getOperador(),
                            alert.getValorUmbral(),
                            alert.getUnidad() != null ? alert.getUnidad() : "",
                            currentValue
                    );
                }
            }
            alert.setUltimoEmailEnviado(LocalDateTime.now());
        }
    }

    /**
     * Check if enough time has passed to resend alert email (45 min by default)
     */
    private boolean shouldResendEmail(Alert alert) {
        if (alert.getUltimoEmailEnviado() == null) return true;
        LocalDateTime resendTime = alert.getUltimoEmailEnviado().plusMinutes(emailResendMinutes);
        return LocalDateTime.now().isAfter(resendTime);
    }

    private String getVariableLabel(String variable) {
        if (variable == null) return "Desconocida";
        return switch (variable) {
            case "temp" -> "Temperatura";
            case "humidity" -> "Humedad";
            case "pressure" -> "Presión";
            case "windSpeed" -> "Velocidad del Viento";
            case "windGust" -> "Ráfaga de Viento";
            case "dewpoint" -> "Punto de Rocío";
            case "heatIndex" -> "Índice de Calor";
            case "windchill" -> "Sensación Térmica";
            case "solarRad" -> "Radiación Solar";
            case "precip" -> "Precipitación";
            case "eto" -> "Evapotranspiración (ETO)";
            case "uvIndex" -> "Índice UV";
            default -> variable;
        };
    }

    private Float getVariableValue(String variable, DataStation data) {
        if (variable == null) return null;

        return switch (variable) {
            case "temp" -> data.getWswdat_temp_c();
            case "humidity" -> data.getWswdat_relative_humidity();
            case "pressure" -> data.getWswdat_pressure_rel_hpa();
            case "windSpeed" -> data.getWswdat_wind_speed_kmh();
            case "windGust" -> data.getWswdat_wind_gust_kmh();
            case "dewpoint" -> data.getWswdat_dewpoint_c();
            case "heatIndex" -> data.getWswdat_heat_index_c();
            case "windchill" -> data.getWswdat_windchill_c();
            case "solarRad" -> data.getWswdat_solar_rad_wm2();
            case "precip" -> data.getWswdat_precip_today_mm();
            case "eto" -> data.getWswdat_eto_mm();
            case "uvIndex" -> data.getWswdat_uv_index();
            default -> {
                logger.warn("Unknown variable key: {}", variable);
                yield null;
            }
        };
    }

    private boolean evaluateCondition(double currentValue, String operator, double threshold) {
        return switch (operator) {
            case ">" -> currentValue > threshold;
            case "<" -> currentValue < threshold;
            case ">=" -> currentValue >= threshold;
            case "<=" -> currentValue <= threshold;
            case "==" -> Math.abs(currentValue - threshold) < 0.01;
            default -> false;
        };
    }

    private boolean isInCooldown(Alert alert) {
        if (alert.getUltimaActivacion() == null) return false;
        LocalDateTime cooldownEnd = alert.getUltimaActivacion().plusMinutes(cooldownMinutes);
        return LocalDateTime.now().isBefore(cooldownEnd);
    }
}
