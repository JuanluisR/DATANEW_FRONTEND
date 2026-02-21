package com.datanew.datanew.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.datanew.datanew.models.entities.DataStation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DataStationRepository extends JpaRepository<DataStation, Long> {

    @Query("SELECT d FROM DataStation d WHERE d.id_estacion = :idEstacion ORDER BY d.wswdat_report_date DESC")
    List<DataStation> findByIdEstacionOrderByDate(@Param("idEstacion") String idEstacion, Pageable pageable);

    default Optional<DataStation> findLatestByIdEstacion(String idEstacion) {
        List<DataStation> results = findByIdEstacionOrderByDate(idEstacion, Pageable.ofSize(1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    // Obtener todos los registros de una estación en un rango de fechas (mismo día)
    @Query("SELECT d FROM DataStation d WHERE d.id_estacion = :idEstacion AND d.wswdat_report_date >= :startDate AND d.wswdat_report_date < :endDate ORDER BY d.wswdat_report_date DESC")
    List<DataStation> findByIdEstacionAndDateRange(@Param("idEstacion") String idEstacion, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Obtener todos los registros de una estación
    @Query("SELECT d FROM DataStation d WHERE d.id_estacion = :idEstacion ORDER BY d.wswdat_report_date DESC")
    List<DataStation> findAllByIdEstacion(@Param("idEstacion") String idEstacion);

    // Obtener registros por estación y rango de fechas ordenados cronológicamente
    @Query("SELECT d FROM DataStation d WHERE d.id_estacion = :idEstacion AND d.wswdat_report_date >= :startDate AND d.wswdat_report_date <= :endDate ORDER BY d.wswdat_report_date ASC")
    List<DataStation> findByIdEstacionAndDateRangeAsc(@Param("idEstacion") String idEstacion, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

}