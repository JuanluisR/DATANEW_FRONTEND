package com.datanew.datanew.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.datanew.datanew.models.entities.ExData;

public interface ExDataRepository extends JpaRepository<ExData, Long> {

    @Query("SELECT e FROM ExData e WHERE e.id_sensor = :idSensor ORDER BY e.report_date DESC")
    List<ExData> findByIdSensorOrderByReportDateDesc(@Param("idSensor") String idSensor);

    @Query("SELECT e FROM ExData e WHERE e.id_sensor = :idSensor ORDER BY e.report_date DESC LIMIT 1")
    Optional<ExData> findLatestByIdSensor(@Param("idSensor") String idSensor);

    @Query("SELECT e FROM ExData e WHERE e.id_estacion = :idEstacion ORDER BY e.report_date DESC")
    List<ExData> findByIdEstacionOrderByReportDateDesc(@Param("idEstacion") String idEstacion);
}
