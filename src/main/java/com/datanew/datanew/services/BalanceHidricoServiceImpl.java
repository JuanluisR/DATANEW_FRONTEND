package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Cultivo;
import com.datanew.datanew.models.entities.DataStation;
import com.datanew.datanew.repositories.DataStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BalanceHidricoServiceImpl implements BalanceHidricoService {

    private static final Logger logger = LoggerFactory.getLogger(BalanceHidricoServiceImpl.class);

    @Autowired
    private DataStationRepository dataStationRepository;

    // Coeficientes Kc por cultivo y etapa (FAO 56)
    private static final Map<String, Map<String, Double>> KC_POR_CULTIVO = new HashMap<>();

    static {
        // Papa
        Map<String, Double> papa = new HashMap<>();
        papa.put("inicial", 0.5);    // 0-25 días
        papa.put("desarrollo", 0.75); // 25-45 días
        papa.put("media", 1.15);      // 45-90 días
        papa.put("final", 0.85);      // 90-120 días
        KC_POR_CULTIVO.put("papa", papa);

        // Aguacate
        Map<String, Double> aguacate = new HashMap<>();
        aguacate.put("inicial", 0.6);
        aguacate.put("desarrollo", 0.75);
        aguacate.put("media", 0.85);
        aguacate.put("final", 0.8);
        KC_POR_CULTIVO.put("aguacate", aguacate);

        // Arroz
        Map<String, Double> arroz = new HashMap<>();
        arroz.put("inicial", 1.05);   // Arroz inundado
        arroz.put("desarrollo", 1.10);
        arroz.put("media", 1.20);
        arroz.put("final", 0.90);
        KC_POR_CULTIVO.put("arroz", arroz);

        // Flores
        Map<String, Double> flores = new HashMap<>();
        flores.put("inicial", 0.5);
        flores.put("desarrollo", 0.7);
        flores.put("media", 1.0);
        flores.put("final", 0.9);
        KC_POR_CULTIVO.put("flores", flores);

        // Mariguana (Cannabis)
        Map<String, Double> mariguana = new HashMap<>();
        mariguana.put("inicial", 0.4);   // Plántula
        mariguana.put("desarrollo", 0.7); // Vegetativo
        mariguana.put("media", 1.0);      // Floración temprana
        mariguana.put("final", 0.8);      // Floración tardía
        KC_POR_CULTIVO.put("mariguana", mariguana);
    }

    // Duración de etapas por cultivo (días)
    private static final Map<String, Map<String, Integer>> DURACION_ETAPAS = new HashMap<>();

    static {
        Map<String, Integer> papa = new HashMap<>();
        papa.put("inicial", 25);
        papa.put("desarrollo", 20);
        papa.put("media", 45);
        papa.put("final", 30);
        DURACION_ETAPAS.put("papa", papa);

        Map<String, Integer> aguacate = new HashMap<>();
        aguacate.put("inicial", 60);
        aguacate.put("desarrollo", 90);
        aguacate.put("media", 120);
        aguacate.put("final", 95);
        DURACION_ETAPAS.put("aguacate", aguacate);

        Map<String, Integer> arroz = new HashMap<>();
        arroz.put("inicial", 30);
        arroz.put("desarrollo", 30);
        arroz.put("media", 60);
        arroz.put("final", 30);
        DURACION_ETAPAS.put("arroz", arroz);

        Map<String, Integer> flores = new HashMap<>();
        flores.put("inicial", 20);
        flores.put("desarrollo", 30);
        flores.put("media", 40);
        flores.put("final", 20);
        DURACION_ETAPAS.put("flores", flores);

        Map<String, Integer> mariguana = new HashMap<>();
        mariguana.put("inicial", 14);
        mariguana.put("desarrollo", 35);
        mariguana.put("media", 35);
        mariguana.put("final", 21);
        DURACION_ETAPAS.put("mariguana", mariguana);
    }

    /**
     * Calcula la etapa actual del cultivo basándose en días desde siembra
     */
    public String calcularEtapaActual(String tipoCultivo, int diasDesdeSiembra) {
        Map<String, Integer> etapas = DURACION_ETAPAS.get(tipoCultivo.toLowerCase());
        if (etapas == null) return "media";

        int acumulado = 0;
        acumulado += etapas.get("inicial");
        if (diasDesdeSiembra <= acumulado) return "inicial";

        acumulado += etapas.get("desarrollo");
        if (diasDesdeSiembra <= acumulado) return "desarrollo";

        acumulado += etapas.get("media");
        if (diasDesdeSiembra <= acumulado) return "media";

        return "final";
    }

    /**
     * Obtiene el coeficiente Kc para un cultivo en una etapa específica
     */
    public Double getKc(String tipoCultivo, String etapa) {
        Map<String, Double> kcs = KC_POR_CULTIVO.get(tipoCultivo.toLowerCase());
        if (kcs == null) return 0.75; // Valor por defecto
        return kcs.getOrDefault(etapa, 0.75);
    }

    /**
     * Calcula el balance hídrico diario para un cultivo
     */
    public Map<String, Object> calcularBalanceDiario(Cultivo cultivo, LocalDate fecha) {
        Map<String, Object> balance = new HashMap<>();

        try {
            // Obtener datos de la estación para la fecha
            LocalDateTime iniciodia = fecha.atStartOfDay();
            LocalDateTime finDia = fecha.plusDays(1).atStartOfDay();

            List<DataStation> datos = dataStationRepository
                    .findByIdEstacionAndDateRange(
                            cultivo.getIdEstacion(), iniciodia, finDia);

            if (datos.isEmpty()) {
                balance.put("error", "No hay datos disponibles para la fecha");
                return balance;
            }

            // Promediar datos del día
            double et0Promedio = datos.stream()
                    .filter(d -> d.getWswdat_eto_mm() != null && !d.getWswdat_eto_mm().isNaN())
                    .mapToDouble(DataStation::getWswdat_eto_mm)
                    .average()
                    .orElse(0.0);

            double precipitacionTotal = datos.stream()
                    .filter(d -> d.getWswdat_precip_today_mm() != null && !d.getWswdat_precip_today_mm().isNaN())
                    .mapToDouble(DataStation::getWswdat_precip_today_mm)
                    .max()
                    .orElse(0.0);

            // Calcular días desde siembra
            int diasDesdeSiembra = (int) ChronoUnit.DAYS.between(cultivo.getFechaSiembra(), fecha);

            // Determinar etapa actual
            String etapaActual = calcularEtapaActual(cultivo.getTipoCultivo(), diasDesdeSiembra);

            // Obtener Kc
            Double kc = getKc(cultivo.getTipoCultivo(), etapaActual);

            // Calcular ETc (Evapotranspiración del cultivo)
            double etc = et0Promedio * kc;

            // Balance hídrico simple
            double balance_mm = precipitacionTotal - etc;

            // Agua disponible
            double aguaDisponible = (cultivo.getCapacidadCampo() != null ? cultivo.getCapacidadCampo() : 100.0) + balance_mm;

            // Nivel de estrés hídrico
            double puntoMarchitez = cultivo.getPuntoMarchitez() != null ? cultivo.getPuntoMarchitez() : 50.0;
            double capacidadCampo = cultivo.getCapacidadCampo() != null ? cultivo.getCapacidadCampo() : 100.0;
            double aguaUtil = capacidadCampo - puntoMarchitez;
            double porcentajeAgua = ((aguaDisponible - puntoMarchitez) / aguaUtil) * 100;

            // Recomendación de riego
            String recomendacion;
            String nivelEstres;
            if (porcentajeAgua >= 70) {
                recomendacion = "No requiere riego";
                nivelEstres = "Sin estrés";
            } else if (porcentajeAgua >= 50) {
                recomendacion = "Monitorear. Posible riego en 1-2 días";
                nivelEstres = "Estrés leve";
            } else if (porcentajeAgua >= 30) {
                recomendacion = "Riego recomendado hoy";
                nivelEstres = "Estrés moderado";
            } else {
                recomendacion = "Riego urgente necesario";
                nivelEstres = "Estrés severo";
            }

            // Calcular volumen de riego necesario (si aplica)
            double riegoNecesario_mm = 0.0;
            if (porcentajeAgua < 70) {
                riegoNecesario_mm = capacidadCampo * 0.7 - aguaDisponible;
                riegoNecesario_mm = Math.max(0, riegoNecesario_mm);
            }

            // Volumen total para el área
            double areaHa = cultivo.getAreaHectareas() != null ? cultivo.getAreaHectareas() : 1.0;
            double volumenRiego_m3 = riegoNecesario_mm * areaHa * 10; // 1 mm en 1 ha = 10 m³

            balance.put("fecha", fecha);
            balance.put("diasDesdeSiembra", diasDesdeSiembra);
            balance.put("etapaActual", etapaActual);
            balance.put("kc", Math.round(kc * 100.0) / 100.0);
            balance.put("et0", Math.round(et0Promedio * 100.0) / 100.0);
            balance.put("etc", Math.round(etc * 100.0) / 100.0);
            balance.put("precipitacion", Math.round(precipitacionTotal * 100.0) / 100.0);
            balance.put("balanceDiario", Math.round(balance_mm * 100.0) / 100.0);
            balance.put("aguaDisponible", Math.round(aguaDisponible * 100.0) / 100.0);
            balance.put("porcentajeAgua", Math.round(porcentajeAgua * 10.0) / 10.0);
            balance.put("nivelEstres", nivelEstres);
            balance.put("recomendacion", recomendacion);
            balance.put("riegoNecesario_mm", Math.round(riegoNecesario_mm * 100.0) / 100.0);
            balance.put("volumenRiego_m3", Math.round(volumenRiego_m3 * 10.0) / 10.0);

        } catch (Exception e) {
            logger.error("Error calculando balance hídrico: {}", e.getMessage());
            balance.put("error", "Error en el cálculo: " + e.getMessage());
        }

        return balance;
    }

    /**
     * Calcula el balance hídrico para un rango de fechas
     */
    public List<Map<String, Object>> calcularBalanceRango(Cultivo cultivo, LocalDate fechaInicio, LocalDate fechaFin) {
        List<Map<String, Object>> balances = new ArrayList<>();

        LocalDate fecha = fechaInicio;
        while (!fecha.isAfter(fechaFin)) {
            Map<String, Object> balance = calcularBalanceDiario(cultivo, fecha);
            balances.add(balance);
            fecha = fecha.plusDays(1);
        }

        return balances;
    }

    /**
     * Obtiene información del cultivo
     */
    public Map<String, Object> getInfoCultivo(String tipoCultivo) {
        Map<String, Object> info = new HashMap<>();
        String tipo = tipoCultivo.toLowerCase();
        info.put("tipoCultivo", tipoCultivo);

        Map<String, Double> kcs = KC_POR_CULTIVO.get(tipo);
        Map<String, Integer> duraciones = DURACION_ETAPAS.get(tipo);

        if (kcs == null || duraciones == null) {
            info.put("error", "Tipo de cultivo no encontrado: " + tipoCultivo);
            return info;
        }

        info.put("coeficientes", kcs);
        info.put("duracionEtapas", duraciones);
        info.put("duracionTotal", duraciones.values().stream().mapToInt(Integer::intValue).sum());

        return info;
    }
}
