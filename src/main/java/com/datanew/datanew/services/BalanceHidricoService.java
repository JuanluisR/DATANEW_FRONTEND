package com.datanew.datanew.services;

import com.datanew.datanew.models.entities.Cultivo;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface BalanceHidricoService {

    String calcularEtapaActual(String tipoCultivo, int diasDesdeSiembra);

    Double getKc(String tipoCultivo, String etapa);

    Map<String, Object> calcularBalanceDiario(Cultivo cultivo, LocalDate fecha);

    List<Map<String, Object>> calcularBalanceRango(Cultivo cultivo, LocalDate fechaInicio, LocalDate fechaFin);

    Map<String, Object> getInfoCultivo(String tipoCultivo);
}
