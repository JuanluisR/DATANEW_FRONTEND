package com.datanew.datanew.models.enums;

public enum PlanType {
    FREE("Free", 0),
    BASIC("Básico", 1),
    PRO("Pro", 2),
    ULTRA("Ultra", 3);

    private final String displayName;
    private final int level;

    PlanType(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getLevel() {
        return level;
    }
}
