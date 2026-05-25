package com.datanew.datanew.models.entities;

import com.datanew.datanew.models.enums.PlanType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type")
    private PlanType planType = PlanType.FREE;

    // Company info
    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_logo_url", columnDefinition = "TEXT")
    private String companyLogoUrl;

    // Plan limits
    @Column(name = "max_stations")
    private Integer maxStations;

    @Column(name = "max_sensors_per_station")
    private Integer maxSensorsPerStation;

    @Column(name = "max_alerts")
    private Integer maxAlerts;

    @Column(name = "data_retention_days")
    private Integer dataRetentionDays;

    // Features
    @Column(name = "email_notifications")
    private Boolean emailNotifications = false;

    @Column(name = "sms_notifications")
    private Boolean smsNotifications = false;

    @Column(name = "api_access")
    private Boolean apiAccess = false;

    @Column(name = "export_data")
    private Boolean exportData = false;

    @Column(name = "realtime_data")
    private Boolean realtimeData = false;

    @Column(name = "advanced_analytics")
    private Boolean advancedAnalytics = false;

    @Column(name = "custom_reports")
    private Boolean customReports = false;

    @Column(name = "priority_support")
    private Boolean prioritySupport = false;

    @Column(name = "white_label")
    private Boolean whiteLabel = false;

    // Dates
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startDate == null) {
            startDate = LocalDateTime.now();
        }
        applyPlanDefaults();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void applyPlanDefaults() {
        switch (this.planType) {
            case FREE:
                this.maxStations = 2;
                this.maxSensorsPerStation = 5;
                this.maxAlerts = 3;
                this.dataRetentionDays = 7;
                this.emailNotifications = false;
                this.smsNotifications = false;
                this.apiAccess = false;
                this.exportData = false;
                this.realtimeData = false;
                this.advancedAnalytics = false;
                this.customReports = false;
                this.prioritySupport = false;
                this.whiteLabel = false;
                break;
            case BASIC:
                this.maxStations = 5;
                this.maxSensorsPerStation = 10;
                this.maxAlerts = 10;
                this.dataRetentionDays = 30;
                this.emailNotifications = true;
                this.smsNotifications = false;
                this.apiAccess = false;
                this.exportData = true;
                this.realtimeData = false;
                this.advancedAnalytics = false;
                this.customReports = false;
                this.prioritySupport = false;
                this.whiteLabel = false;
                break;
            case PRO:
                this.maxStations = 20;
                this.maxSensorsPerStation = 25;
                this.maxAlerts = 50;
                this.dataRetentionDays = 90;
                this.emailNotifications = true;
                this.smsNotifications = true;
                this.apiAccess = true;
                this.exportData = true;
                this.realtimeData = true;
                this.advancedAnalytics = true;
                this.customReports = false;
                this.prioritySupport = false;
                this.whiteLabel = false;
                break;
            case ULTRA:
                this.maxStations = -1; // Unlimited
                this.maxSensorsPerStation = -1; // Unlimited
                this.maxAlerts = -1; // Unlimited
                this.dataRetentionDays = 365;
                this.emailNotifications = true;
                this.smsNotifications = true;
                this.apiAccess = true;
                this.exportData = true;
                this.realtimeData = true;
                this.advancedAnalytics = true;
                this.customReports = true;
                this.prioritySupport = true;
                this.whiteLabel = true;
                break;
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public PlanType getPlanType() {
        return planType;
    }

    public void setPlanType(PlanType planType) {
        this.planType = planType;
        applyPlanDefaults();
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyLogoUrl() {
        return companyLogoUrl;
    }

    public void setCompanyLogoUrl(String companyLogoUrl) {
        this.companyLogoUrl = companyLogoUrl;
    }

    public Integer getMaxStations() {
        return maxStations;
    }

    public void setMaxStations(Integer maxStations) {
        this.maxStations = maxStations;
    }

    public Integer getMaxSensorsPerStation() {
        return maxSensorsPerStation;
    }

    public void setMaxSensorsPerStation(Integer maxSensorsPerStation) {
        this.maxSensorsPerStation = maxSensorsPerStation;
    }

    public Integer getMaxAlerts() {
        return maxAlerts;
    }

    public void setMaxAlerts(Integer maxAlerts) {
        this.maxAlerts = maxAlerts;
    }

    public Integer getDataRetentionDays() {
        return dataRetentionDays;
    }

    public void setDataRetentionDays(Integer dataRetentionDays) {
        this.dataRetentionDays = dataRetentionDays;
    }

    public Boolean getEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public Boolean getSmsNotifications() {
        return smsNotifications;
    }

    public void setSmsNotifications(Boolean smsNotifications) {
        this.smsNotifications = smsNotifications;
    }

    public Boolean getApiAccess() {
        return apiAccess;
    }

    public void setApiAccess(Boolean apiAccess) {
        this.apiAccess = apiAccess;
    }

    public Boolean getExportData() {
        return exportData;
    }

    public void setExportData(Boolean exportData) {
        this.exportData = exportData;
    }

    public Boolean getRealtimeData() {
        return realtimeData;
    }

    public void setRealtimeData(Boolean realtimeData) {
        this.realtimeData = realtimeData;
    }

    public Boolean getAdvancedAnalytics() {
        return advancedAnalytics;
    }

    public void setAdvancedAnalytics(Boolean advancedAnalytics) {
        this.advancedAnalytics = advancedAnalytics;
    }

    public Boolean getCustomReports() {
        return customReports;
    }

    public void setCustomReports(Boolean customReports) {
        this.customReports = customReports;
    }

    public Boolean getPrioritySupport() {
        return prioritySupport;
    }

    public void setPrioritySupport(Boolean prioritySupport) {
        this.prioritySupport = prioritySupport;
    }

    public Boolean getWhiteLabel() {
        return whiteLabel;
    }

    public void setWhiteLabel(Boolean whiteLabel) {
        this.whiteLabel = whiteLabel;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
