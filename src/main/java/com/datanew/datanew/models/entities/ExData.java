package com.datanew.datanew.models.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "exs_data", indexes = {
    @Index(name = "idx_exsdata_sensor", columnList = "id_sensor"),
    @Index(name = "idx_exsdata_report_date", columnList = "report_date")
})
public class ExData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ex_data_id;

    @Column(name = "id_sensor")
    private String id_sensor;

    @Column(name = "id_estacion")
    private String id_estacion;

    @Column(name = "report_date")
    private LocalDateTime report_date;

    @Column(name = "value")
    private Float value;

    @Column(name = "unit")
    private String unit;

    public Long getEx_data_id() { return ex_data_id; }
    public void setEx_data_id(Long ex_data_id) { this.ex_data_id = ex_data_id; }

    public String getId_sensor() { return id_sensor; }
    public void setId_sensor(String id_sensor) { this.id_sensor = id_sensor; }

    public String getId_estacion() { return id_estacion; }
    public void setId_estacion(String id_estacion) { this.id_estacion = id_estacion; }

    public LocalDateTime getReport_date() { return report_date; }
    public void setReport_date(LocalDateTime report_date) { this.report_date = report_date; }

    public Float getValue() { return value; }
    public void setValue(Float value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
