package com.datanew.datanew.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.datanew.datanew.models.entities.Sensor;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    @Query("SELECT s FROM Sensor s WHERE s.id_estacion = :idEstacion")
    List<Sensor> findByIdEstacion(@Param("idEstacion") String idEstacion);

    @Query("SELECT COUNT(s) > 0 FROM Sensor s WHERE s.id_sensor = :idSensor AND s.canal = :canal AND s.tipo_sensor = :tipoSensor AND s.username = :username AND (:excludeId IS NULL OR s.sensor_id <> :excludeId)")
    boolean existsDuplicate(@Param("idSensor") String idSensor, @Param("canal") Integer canal, @Param("tipoSensor") String tipoSensor, @Param("username") String username, @Param("excludeId") Long excludeId);
}