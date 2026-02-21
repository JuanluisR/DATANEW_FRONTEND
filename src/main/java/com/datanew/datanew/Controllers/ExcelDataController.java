package com.datanew.datanew.Controllers;

import com.datanew.datanew.services.ExcelDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/data")
public class ExcelDataController {

    @Autowired
    private ExcelDataService excelDataService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "El archivo está vacío"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".xlsx") && !filename.toLowerCase().endsWith(".xls") && !filename.toLowerCase().endsWith(".csv"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "El archivo debe ser de tipo Excel (.xlsx, .xls) o CSV (.csv)"));
        }

        try {
            Map<String, Object> result = excelDataService.processExcelFile(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error al procesar el archivo: " + e.getMessage()));
        }
    }

    @GetMapping("/template")
    public ResponseEntity<?> getTemplate() {
        Map<String, Object> template = excelDataService.getTemplateColumns();
        return ResponseEntity.ok(template);
    }
}
