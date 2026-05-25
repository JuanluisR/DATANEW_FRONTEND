package com.datanew.datanew.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class StationSseService {

    private static final Logger log = LoggerFactory.getLogger(StationSseService.class);

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String username) {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(username, emitter));
        emitter.onTimeout(() -> removeEmitter(username, emitter));
        emitter.onError(e -> removeEmitter(username, emitter));
        log.debug("SSE client connected: {}", username);
        return emitter;
    }

    public void sendUpdate(String username, Object data) {
        List<SseEmitter> userEmitters = emitters.get(username);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name("statsUpdate").data(data));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }
        userEmitters.removeAll(deadEmitters);
    }

    private void removeEmitter(String username, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(username);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            log.debug("SSE client disconnected: {}", username);
        }
    }
}
