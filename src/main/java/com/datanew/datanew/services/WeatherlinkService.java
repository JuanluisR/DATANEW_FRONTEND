package com.datanew.datanew.services;

import java.util.List;

public interface WeatherlinkService {

    List<?> getDevices(String apiKey, String apiSecret);

    List<?> getCurrentData(Long stationId);
}
