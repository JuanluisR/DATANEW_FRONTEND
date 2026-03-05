package com.datanew.datanew.services;

public interface EmailService {

    void sendAlertEmail(String to, String alertName, String stationName,
                        String variable, String operator, double threshold,
                        String unit, double currentValue);
}
