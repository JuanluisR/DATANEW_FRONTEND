package com.datanew.datanew.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.datanew.datanew.models.entities.Station;

import java.util.List;
import java.util.Optional;

public interface StationRepository extends JpaRepository<Station, Long> {

    @Query("SELECT s FROM Station s WHERE s.id_estacion = :idEstacion")
    Optional<Station> findByIdEstacion(@Param("idEstacion") String idEstacion);

    @Query("SELECT s FROM Station s WHERE s.username = :username")
    List<Station> findByUsername(@Param("username") String username);

    @Query("SELECT s FROM Station s WHERE s.id_estacion = :idEstacion AND s.username = :username")
    Optional<Station> findByIdEstacionAndUsername(@Param("idEstacion") String idEstacion, @Param("username") String username);

}