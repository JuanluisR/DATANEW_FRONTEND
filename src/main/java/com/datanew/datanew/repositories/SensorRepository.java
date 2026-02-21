package com.datanew.datanew.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.datanew.datanew.models.entities.Sensor;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    @Query("SELECT s FROM Sensor s WHERE s.id_estacion = :idEstacion")
    List<Sensor> findByIdEstacion(@Param("idEstacion") String idEstacion);
}