package com.datanew.datanew.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.datanew.datanew.models.entities.Station;
@Repository
public interface StationUserRepository extends JpaRepository<Station, Long>{
 
@Query(value = "SELECT * FROM estaciones WHERE username = ?1", nativeQuery = true)
   
   List<Station> getstationsUser(String username);
}