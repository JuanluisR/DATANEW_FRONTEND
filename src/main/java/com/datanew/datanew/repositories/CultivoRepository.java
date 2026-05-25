package com.datanew.datanew.repositories;

import com.datanew.datanew.models.entities.Cultivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CultivoRepository extends JpaRepository<Cultivo, Long> {

    List<Cultivo> findByUsernameOrderByFechaCreacionDesc(String username);

    List<Cultivo> findByUsernameAndIsActiveTrue(String username);

    List<Cultivo> findByIdEstacion(String idEstacion);

    List<Cultivo> findByIdEstacionAndIsActiveTrue(String idEstacion);
}
