package com.datanew.datanew.services;

import java.util.Map;

public interface ExternalLocationService {

    Map<String, Object> geocode(double lat, double lon);
}
