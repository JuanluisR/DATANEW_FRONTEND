package com.datanew.datanew.repositories;

import com.datanew.datanew.models.entities.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByUsername(String username);

    List<Alert> findByUsernameAndIsActiveTrue(String username);

    List<Alert> findByIdEstacion(String idEstacion);

    List<Alert> findByIdEstacionAndIsActiveTrue(String idEstacion);

    List<Alert> findByUsernameOrderByFechaCreacionDesc(String username);

    List<Alert> findByIsActiveTrue();
}
