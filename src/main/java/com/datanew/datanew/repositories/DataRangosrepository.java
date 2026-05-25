package com.datanew.datanew.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.datanew.datanew.models.entities.DataStation;

public interface DataRangosrepository extends JpaRepository<DataStation, Long> {
}
