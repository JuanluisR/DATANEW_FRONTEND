import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

Highcharts.setOptions({ accessibility: { enabled: false } });
import stationService from '../services/stationService';
import dataStationService from '../services/dataStationService';
import sensorService from '../services/sensorService';
import { useAuth } from '../context/AuthContext';
import { Search, Download, BarChart3, Calendar, Clock, AlertCircle, FileText, Sun, Droplets, Wind, CloudRain, Thermometer, Compass, Cloud, Sprout } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

registerLocale('es', es);

const SENSOR_VAR_MAP = {
  'temperatura':    { key: 'wswdat_temp_c',             unit: '°C',   color: '#ef4444', label: 'Temperatura' },
  'temperature':    { key: 'wswdat_temp_c',             unit: '°C',   color: '#ef4444', label: 'Temperatura' },
  'humedad':        { key: 'wswdat_relative_humidity',  unit: '%',    color: '#3b82f6', label: 'Humedad' },
  'humidity':       { key: 'wswdat_relative_humidity',  unit: '%',    color: '#3b82f6', label: 'Humedad' },
  'presion':        { key: 'wswdat_pressure_rel_hpa',   unit: 'hPa',  color: '#8b5cf6', label: 'Presión' },
  'pressure':       { key: 'wswdat_pressure_rel_hpa',   unit: 'hPa',  color: '#8b5cf6', label: 'Presión' },
  'viento':         { key: 'wswdat_wind_speed_kmh',     unit: 'km/h', color: '#14b8a6', label: 'Velocidad Viento' },
  'wind':           { key: 'wswdat_wind_speed_kmh',     unit: 'km/h', color: '#14b8a6', label: 'Velocidad Viento' },
  'anemometro':     { key: 'wswdat_wind_speed_kmh',     unit: 'km/h', color: '#14b8a6', label: 'Velocidad Viento' },
  'lluvia':         { key: 'wswdat_precip_today_mm',    unit: 'mm',   color: '#0ea5e9', label: 'Precipitación' },
  'rain':           { key: 'wswdat_precip_today_mm',    unit: 'mm',   color: '#0ea5e9', label: 'Precipitación' },
  'precipitacion':  { key: 'wswdat_precip_today_mm',    unit: 'mm',   color: '#0ea5e9', label: 'Precipitación' },
  'solar':          { key: 'wswdat_solar_rad_wm2',      unit: 'W/m²', color: '#f59e0b', label: 'Radiación Solar' },
  'radiacion':      { key: 'wswdat_solar_rad_wm2',      unit: 'W/m²', color: '#f59e0b', label: 'Radiación Solar' },
  'uv':             { key: 'wswdat_uv_index',           unit: '',     color: '#eab308', label: 'UV Index' },
  'eto':            { key: 'wswdat_eto_mm',             unit: 'mm',   color: '#10b981', label: 'ETo' },
  'rocio':          { key: 'wswdat_dewpoint_c',         unit: '°C',   color: '#06b6d4', label: 'Punto de Rocío' },
  'dewpoint':       { key: 'wswdat_dewpoint_c',         unit: '°C',   color: '#06b6d4', label: 'Punto de Rocío' },
};

const WIND_DIR_MAP = {
  'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
  'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
  'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
  'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

const DataQuery = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timeScale, setTimeScale] = useState('minutal');
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(true);
  const [data, setData] = useState([]);
  const [rawQueryData, setRawQueryData] = useState([]);
  const [error, setError] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState(['temperature', 'humidity']);
  const [sensors, setSensors] = useState([]);
  const chartsRef = useRef(null);

  const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(dateString);
    }
    return new Date(dateString + 'Z');
  };

  const WIND_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  const degreesToDirection = (degrees) => {
    if (degrees === null || degrees === undefined || isNaN(degrees)) return null;
    const idx = Math.round(((degrees % 360) / 22.5)) % 16;
    return WIND_DIRECTIONS[idx];
  };

  const hasValidData = (dataArray, key) => {
    if (!dataArray || dataArray.length === 0) return false;
    return dataArray.some(item => {
      const val = item[key];
      return val !== null && val !== undefined && !isNaN(val) && val !== 0;
    });
  };

  const climateVariables = [
    { key: 'wswdat_temp_c', label: 'Temperatura (°C)', color: '#ef4444', unit: '°C' },
    { key: 'wswdat_relative_humidity', label: 'Humedad (%)', color: '#3b82f6', unit: '%' },
    { key: 'wswdat_pressure_rel_hpa', label: 'Presión (hPa)', color: '#8b5cf6', unit: 'hPa' },
    { key: 'wswdat_wind_speed_kmh', label: 'Velocidad Viento (km/h)', color: '#22c55e', unit: 'km/h' },
    { key: 'wswdat_dewpoint_c', label: 'Punto de Rocío (°C)', color: '#06b6d4', unit: '°C' },
    { key: 'wswdat_precip_today_mm', label: 'Precipitación (mm)', color: '#0ea5e9', unit: 'mm', type: 'bar' },
    { key: 'wswdat_solar_rad_wm2', label: 'Radiación Solar (W/m²)', color: '#f59e0b', unit: 'W/m²' },
    { key: 'wswdat_eto_mm', label: 'ETO (mm)', color: '#10b981', unit: 'mm' },
  ];

  const timeScales = [
    { value: 'minutal', label: 'Minutal' },
    { value: 'horario', label: 'Horario' },
    { value: 'diario', label: 'Diario' },
    { value: 'mensual', label: 'Mensual' },
  ];

  useEffect(() => {
    fetchStations();
  }, [user]);

  const fetchStations = async () => {
    try {
      if (!user?.username) return;
      const response = await stationService.getByUsername(user.username);
      setStations(response.data);
    } catch (error) {
      console.error('Error al cargar estaciones:', error);
    } finally {
      setLoadingStations(false);
    }
  };

  const validateDateRange = (start, end) => {
    if (!start || !end) return true;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && !validateDateRange(date, endDate)) {
      setError('El rango de fechas no debe superar los 30 días');
    } else {
      setError('');
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate && !validateDateRange(startDate, date)) {
      setError('El rango de fechas no debe superar los 30 días');
    } else {
      setError('');
    }
  };

  const processDataByScale = (rawData, scale) => {
    if (!rawData || rawData.length === 0) return [];

    if (scale === 'minutal') {
      return rawData.map(item => ({
        ...item,
        timestamp: parseLocalDate(item.wswdat_report_date).toLocaleString('es-ES', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        })
      }));
    }

    const grouped = {};
    rawData.forEach(item => {
      const date = parseLocalDate(item.wswdat_report_date);
      let key;

      if (scale === 'horario') {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      } else if (scale === 'diario') {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      } else if (scale === 'mensual') {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      }

      if (!grouped[key]) {
        grouped[key] = { items: [], date };
      }
      grouped[key].items.push(item);
    });

    return Object.values(grouped).map(group => {
      const avg = {};
      climateVariables.forEach(v => {
        const values = group.items.map(i => i[v.key]).filter(val => val !== null && !isNaN(val));
        if (v.key === 'wswdat_precip_today_mm') {
          avg[v.key] = values.length > 0 ? Math.max(...values) : null;
        } else {
          avg[v.key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
        }
      });

      let timestamp;
      if (scale === 'horario') {
        timestamp = group.date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit' }) + 'h';
      } else if (scale === 'diario') {
        timestamp = group.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      } else {
        timestamp = group.date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }

      return { ...avg, timestamp };
    });
  };

  const processWindRoseData = (rawData) => {
    if (!rawData || rawData.length === 0) return { roseData: [], predominant: '-', predominantCount: 0, total: 0 };

    const dirCounts = {};
    WIND_DIRECTIONS.forEach(d => { dirCounts[d] = 0; });

    let validCount = 0;
    rawData.forEach(item => {
      let dir = item.wswdat_wind_dir;
      if (!dir && item.wswdat_wind_degrees !== null && item.wswdat_wind_degrees !== undefined) {
        dir = degreesToDirection(item.wswdat_wind_degrees);
      }
      if (dir && WIND_DIRECTIONS.includes(dir)) {
        dirCounts[dir]++;
        validCount++;
      }
    });

    if (validCount === 0) return { roseData: [], predominant: '-', predominantCount: 0, total: 0 };

    const roseData = WIND_DIRECTIONS.map(d => ({
      direction: d,
      frequency: dirCounts[d],
      percentage: parseFloat(((dirCounts[d] / validCount) * 100).toFixed(1))
    }));

    const predominant = Object.entries(dirCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      roseData,
      predominant: predominant[0],
      predominantCount: predominant[1],
      total: validCount
    };
  };

  const handleQuery = async () => {
    if (!selectedStation) {
      setError('Selecciona una estación');
      return;
    }
    if (!startDate || !endDate) {
      setError('Selecciona un rango de fechas');
      return;
    }
    if (!validateDateRange(startDate, endDate)) {
      setError('El rango de fechas no debe superar los 30 días');
      return;
    }

    setLoading(true);
    setError('');
    setShowCharts(false);

    try {
      const formatLocalDateTime = (date, endOfDay = false) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = endOfDay ? '23:59:59' : '00:00:00';
        return `${year}-${month}-${day}T${time}`;
      };

      const startISO = formatLocalDateTime(startDate, false);
      const endISO = formatLocalDateTime(endDate, true);

      const response = await dataStationService.queryByDateRange(selectedStation, startISO, endISO);

      setRawQueryData(response.data || []);
      const processedData = processDataByScale(response.data, timeScale);
      setData(processedData);
      setShowCharts(true);

      try {
        const sensorsRes = await sensorService.getByStation(selectedStation);
        setSensors(sensorsRes.data || []);
      } catch (_) {
        setSensors([]);
      }
    } catch (error) {
      console.error('Error al consultar datos:', error);
      setError('Error al consultar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!rawQueryData || rawQueryData.length === 0) {
      setError('No hay datos para descargar');
      return;
    }

    const station = stations.find(s => s.id_estacion === selectedStation);
    const headers = ['ID_Estacion', 'wswdat_report_date', ...climateVariables.map(v => v.label)];

    const rows = rawQueryData.map(item => {
      const reportDate = item.wswdat_report_date 
        ? parseLocalDate(item.wswdat_report_date).toISOString().replace('T', ' ').substring(0, 19)
        : '';

      return [
        item.id_estacion || selectedStation,
        reportDate,
        ...climateVariables.map(v => {
          const value = item[v.key];
          if (value === null || value === undefined || value === '' || isNaN(value)) {
            return '';
          }
          return Number(value).toFixed(2);
        })
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const stationName = station?.id_estacion || selectedStation;
    link.setAttribute('download', `datos_${stationName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    if (!data || data.length === 0) {
      setError('No hay datos para generar el informe');
      return;
    }

    const station = stations.find(s => s.id_estacion === selectedStation);
    if (!station) {
      setError('No se encontró información de la estación');
      return;
    }

    let rawData;
    try {
      const formatLocalDateTime = (date, endOfDay = false) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = endOfDay ? '23:59:59' : '00:00:00';
        return `${year}-${month}-${day}T${time}`;
      };
      const startISO = formatLocalDateTime(startDate, false);
      const endISO = formatLocalDateTime(endDate, true);
      const response = await dataStationService.queryByDateRange(selectedStation, startISO, endISO);
      rawData = response.data;
    } catch (_) {
      setError('Error al obtener datos para el informe');
      return;
    }

    if (!rawData || rawData.length === 0) {
      setError('No hay datos para generar el informe');
      return;
    }

    const hourlyGroups = {};
    rawData.forEach(item => {
      const date = parseLocalDate(item.wswdat_report_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      if (!hourlyGroups[key]) {
        hourlyGroups[key] = [];
      }
      hourlyGroups[key].push(item);
    });

    const dailyPrecip = {};
    rawData.forEach(item => {
      const date = parseLocalDate(item.wswdat_report_date);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!dailyPrecip[dayKey]) {
        dailyPrecip[dayKey] = [];
      }
      dailyPrecip[dayKey].push(item.wswdat_precip_today_mm);
    });

    const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const min = (arr) => arr.length > 0 ? Math.min(...arr) : null;
    const max = (arr) => arr.length > 0 ? Math.max(...arr) : null;
    const validNums = (items, field) => items.map(i => i[field]).filter(v => v !== null && v !== undefined && !isNaN(v));

    const predominantDir = (items) => {
      const dirs = items.map(i => i.wswdat_wind_dir).filter(d => d !== null && d !== undefined && d !== '');
      if (dirs.length === 0) return '-';
      const counts = {};
      dirs.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };

    const sortedHours = Object.keys(hourlyGroups).sort();
    const tableRows = sortedHours.map(hour => {
      const items = hourlyGroups[hour];
      const dayKey = hour.split(' ')[0];

      const temps = validNums(items, 'wswdat_temp_c');
      const humids = validNums(items, 'wswdat_relative_humidity');
      const pressures = validNums(items, 'wswdat_pressure_rel_hpa');
      const precipRates = validNums(items, 'wswdat_precip_rate_mmh');
      const windSpeeds = validNums(items, 'wswdat_wind_speed_kmh');
      const windGusts = validNums(items, 'wswdat_wind_gust_kmh');
      const solarRads = validNums(items, 'wswdat_solar_rad_wm2');
      const uvIndices = validNums(items, 'wswdat_uv_index');
      const etos = validNums(items, 'wswdat_eto_mm');

      const precipToday = validNums(items, 'wswdat_precip_today_mm');
      const precipHourly = precipToday.length >= 2 ? (max(precipToday) - min(precipToday)) : (precipRates.length > 0 ? avg(precipRates) : null);

      const dailyPrecipValues = dailyPrecip[dayKey] ? dailyPrecip[dayKey].filter(v => v !== null && !isNaN(v)) : [];
      const precipDaily = dailyPrecipValues.length > 0 ? max(dailyPrecipValues) : null;

      const fmt = (v) => v !== null && v !== undefined ? Number(v).toFixed(1) : '-';

      return [
        hour,
        fmt(avg(temps)), fmt(min(temps)), fmt(max(temps)),
        fmt(avg(humids)), fmt(min(humids)), fmt(max(humids)),
        fmt(avg(pressures)), fmt(min(pressures)), fmt(max(pressures)),
        fmt(precipHourly), fmt(precipDaily),
        predominantDir(items),
        fmt(avg(windSpeeds)), fmt(max(windSpeeds)), fmt(avg(windGusts)), fmt(max(windGusts)),
        fmt(avg(solarRads)),
        fmt(avg(uvIndices)),
        fmt(etos.length > 0 ? etos.reduce((a, b) => a + b, 0) : null)
      ];
    });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

    const ubicacion = [station.localidad, station.estado, station.pais].filter(Boolean).join(', ') || 'N/A';
    const fechaReporte = `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Informe Meteorológico Horario', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`ID Estación: ${station.id_estacion}`, 14, 25);
    doc.text(`Nombre: ${station.nombre_estacion || 'N/A'}`, 14, 30);
    doc.text(`Ubicación: ${ubicacion}`, 14, 35);
    doc.text(`Fecha del Reporte: ${fechaReporte}`, 14, 40);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, doc.internal.pageSize.getWidth() - 14, 25, { align: 'right' });
    doc.text(`Total registros: ${rawData.length} | Horas: ${sortedHours.length}`, doc.internal.pageSize.getWidth() - 14, 30, { align: 'right' });

    autoTable(doc, {
      startY: 45,
      head: [
        [
          { content: 'Fecha/Hora', rowSpan: 2 },
          { content: 'Temperatura °C', colSpan: 3 },
          { content: 'Humedad Relativa %', colSpan: 3 },
          { content: 'Presión hPa', colSpan: 3 },
          { content: 'Precipitación mm', colSpan: 2 },
          { content: 'Dir. Viento', rowSpan: 2 },
          { content: 'Velocidad Viento km/h', colSpan: 4 },
          { content: 'Rad. Solar W/m²', rowSpan: 2 },
          { content: 'UV Index', rowSpan: 2 },
          { content: 'ETo mm', rowSpan: 2 },
        ],
        [
          'Prom', 'Mín', 'Máx',
          'Prom', 'Mín', 'Máx',
          'Prom', 'Mín', 'Máx',
          'Acum. Horario', 'Acum. Diario',
          'Prom', 'Máx', 'Ráf. Prom', 'Ráf. Máx',
        ]
      ],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 28 },
      },
      margin: { left: 5, right: 5 },
    });

    if (chartsRef.current) {
      const chartElements = chartsRef.current.querySelectorAll('.bg-white.rounded-xl');

      if (chartElements.length > 0) {
        doc.addPage('a3', 'landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Gráficas de Variables Climáticas', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Estación: ${station.nombre_estacion} (${station.id_estacion}) | Escala: ${timeScale}`, pageWidth / 2, 22, { align: 'center' });

        let currentY = 30;
        const chartMargin = 8;
        const chartWidth = (pageWidth - chartMargin * 3) / 2;
        const chartHeight = 85;
        let col = 0;

        for (let i = 0; i < chartElements.length; i++) {
          try {
            const canvas = await html2canvas(chartElements[i], {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const xPos = chartMargin + col * (chartWidth + chartMargin);

            if (currentY + chartHeight > doc.internal.pageSize.getHeight() - 15) {
              doc.addPage('a3', 'landscape');
              currentY = 15;
            }

            doc.addImage(imgData, 'PNG', xPos, currentY, chartWidth, chartHeight);

            col++;
            if (col >= 2) {
              col = 0;
              currentY += chartHeight + chartMargin;
            }
          } catch (err) {
            console.error(`Error al capturar gráfica ${i}:`, err);
          }
        }
      }
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(128);
      doc.text(
        `Página ${i} de ${totalPages}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
      doc.setTextColor(0);
    }

    const fileName = `informe_${station.id_estacion}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const computeStats = (rawData) => {
    if (!rawData || rawData.length === 0) return {};

    const getValid = (key) =>
      rawData.map(d => d[key]).filter(v => v !== null && v !== undefined && !isNaN(Number(v))).map(Number);

    const result = {};

    ['wswdat_temp_c', 'wswdat_relative_humidity', 'wswdat_pressure_rel_hpa',
     'wswdat_wind_speed_kmh', 'wswdat_solar_rad_wm2', 'wswdat_dewpoint_c'].forEach(key => {
      const vals = getValid(key);
      result[key] = vals.length > 0 ? {
        min: Math.min(...vals),
        max: Math.max(...vals),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        accum: null
      } : null;
    });

    // Precipitation: accumulated = sum of daily max
    const precipByDay = {};
    rawData.forEach(item => {
      const val = item.wswdat_precip_today_mm;
      if (val !== null && val !== undefined && !isNaN(Number(val))) {
        const day = parseLocalDate(item.wswdat_report_date).toISOString().split('T')[0];
        precipByDay[day] = Math.max(precipByDay[day] || 0, Number(val));
      }
    });
    const allPrecipVals = getValid('wswdat_precip_today_mm');
    const dailyPrecipVals = Object.values(precipByDay);
    result['wswdat_precip_today_mm'] = dailyPrecipVals.length > 0 ? {
      min: null,
      max: allPrecipVals.length > 0 ? Math.max(...allPrecipVals) : null,
      avg: null,
      accum: dailyPrecipVals.reduce((a, b) => a + b, 0)
    } : null;

    // ETO: total sum
    const etoVals = getValid('wswdat_eto_mm');
    result['wswdat_eto_mm'] = etoVals.length > 0 ? {
      min: null, max: null, avg: null,
      accum: etoVals.reduce((a, b) => a + b, 0)
    } : null;

    return result;
  };

  if (loadingStations) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consulta de Datos</h1>
        <p className="text-gray-600 mt-1">Consulta y grafica los datos de tus estaciones meteorológicas</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Estación
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Seleccionar estación...</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id_estacion}>
                  {station.nombre_estacion} ({station.id_estacion})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha Inicio
            </label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={new Date()}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha Fin
            </label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Escala de Tiempo
            </label>
            <div className="flex flex-wrap gap-2">
              {timeScales.map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => setTimeScale(scale.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeScale === scale.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>El rango de fechas no debe superar los 30 días para un rendimiento óptimo.</span>
        </div>

        {error && (
          <div className="mt-4 flex items-center text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={handleQuery}
            disabled={loading || !selectedStation || !startDate || !endDate}
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <BarChart3 className="h-5 w-5 mr-2" />
            )}
            Graficar
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={!showCharts || rawQueryData.length === 0}
            className="flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar CSV
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={!showCharts || data.length === 0}
            className="flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <FileText className="h-5 w-5 mr-2" />
            Informe
          </button>
        </div>
      </div>

      {showCharts && data.length > 0 && (
        <div className="space-y-6">
          {/* Statistics Summary Table */}
          {(() => {
            const stats = computeStats(rawQueryData);
            const tableRows = [
              { key: 'wswdat_temp_c',            label: 'Temperatura',     unit: '°C',   icon: Thermometer, color: 'text-red-500',     bg: 'bg-red-50' },
              { key: 'wswdat_relative_humidity',  label: 'Humedad',         unit: '%',    icon: Droplets,    color: 'text-blue-500',    bg: 'bg-blue-50' },
              { key: 'wswdat_pressure_rel_hpa',   label: 'Presión',         unit: 'hPa',  icon: BarChart3,   color: 'text-purple-500',  bg: 'bg-purple-50' },
              { key: 'wswdat_wind_speed_kmh',     label: 'Vel. Viento',     unit: 'km/h', icon: Wind,        color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { key: 'wswdat_solar_rad_wm2',      label: 'Radiación Solar', unit: 'W/m²', icon: Sun,         color: 'text-amber-500',   bg: 'bg-amber-50' },
              { key: 'wswdat_precip_today_mm',    label: 'Lluvia',          unit: 'mm',   icon: CloudRain,   color: 'text-sky-500',     bg: 'bg-sky-50' },
              { key: 'wswdat_eto_mm',             label: 'ETo',             unit: 'mm',   icon: Sprout,      color: 'text-teal-500',    bg: 'bg-teal-50' },
            ];
            const fmt = (v, d = 1) => (v !== null && v !== undefined ? Number(v).toFixed(d) : null);
            const hasAnyStats = tableRows.some(r => stats[r.key]);
            if (!hasAnyStats) return null;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-slate-300" />
                      Resumen Estadístico del Período
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">{rawQueryData.length.toLocaleString()} registros · {startDate?.toLocaleDateString('es-ES')} – {endDate?.toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">Variable</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mínimo</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Máximo</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Promedio</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => {
                        const s = stats[row.key];
                        if (!s) return null;
                        const Icon = row.icon;
                        const minVal = fmt(s.min);
                        const maxVal = fmt(s.max);
                        const avgVal = fmt(s.avg);
                        const accumVal = fmt(s.accum);
                        return (
                          <tr
                            key={row.key}
                            className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${row.bg} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`h-4 w-4 ${row.color}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700 text-sm leading-tight">{row.label}</div>
                                  <div className="text-xs text-gray-400">{row.unit}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {minVal ? (
                                <span className="font-semibold text-gray-700">{minVal} <span className="font-normal text-gray-400 text-xs">{row.unit}</span></span>
                              ) : <span className="text-gray-300 text-base">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {maxVal ? (
                                <span className="font-semibold text-gray-700">{maxVal} <span className="font-normal text-gray-400 text-xs">{row.unit}</span></span>
                              ) : <span className="text-gray-300 text-base">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {avgVal ? (
                                <span className="font-semibold text-gray-700">{avgVal} <span className="font-normal text-gray-400 text-xs">{row.unit}</span></span>
                              ) : <span className="text-gray-300 text-base">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {accumVal ? (
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${row.bg} ${row.color}`}>
                                  {accumVal} {row.unit}
                                </span>
                              ) : <span className="text-gray-300 text-base">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          <div ref={chartsRef} className="space-y-6">
            {/* Temperature & Humidity Chart */}
            {(hasValidData(data, 'wswdat_temp_c') || hasValidData(data, 'wswdat_relative_humidity')) && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                Temperatura y Humedad
              </h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: [{ 
                    title: { text: '°C' },
                    opposite: false
                  }, { 
                    title: { text: '%' },
                    opposite: true,
                    min: 0,
                    max: 100
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;
                      const units = { 'Temperatura': '°C', 'Humedad': '%' };
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      this.points.forEach(p => {
                        const val = p.y !== null && p.y !== undefined ? p.y.toFixed(1) : '-';
                        s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + ' ' + (units[p.series.name] || '') + '</div>';
                      });
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: { marker: { enabled: true } }
                  },
                  series: [
                    { name: 'Temperatura', data: data.map(d => d.wswdat_temp_c), type: 'spline', color: '#ef4444', yAxis: 0 },
                    { name: 'Humedad', data: data.map(d => d.wswdat_relative_humidity), type: 'spline', color: '#3b82f6', yAxis: 1 }
                  ]
                }}
              />
            </div>
            )}

            {/* Wind Speed & Direction Chart */}
            {(hasValidData(data, 'wswdat_wind_speed_kmh') || hasValidData(rawQueryData, 'wswdat_wind_dir') || hasValidData(rawQueryData, 'wswdat_wind_degrees')) && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Wind className="h-5 w-5 text-teal-500" />
                Viento (Dirección y Velocidad)
              </h3>
              {/* Predominant Wind Direction */}
              {rawQueryData.length > 0 && (() => {
                const wind = processWindRoseData(rawQueryData);
                if (wind.predominant && wind.predominant !== '-') {
                  return (
                    <div className="text-center mb-4">
                      <span className="inline-block px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                        <span className="mr-2">Dirección predominante:</span>
                        <strong>{wind.predominant}</strong>
                        <span className="mx-2">•</span>
                        <span>{wind.predominantCount} de {wind.total} registros</span>
                        <span className="mx-2">•</span>
                        <span>{((wind.predominantCount / wind.total) * 100).toFixed(1)}%</span>
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: [{ 
                    title: { text: 'km/h' },
                    min: 0
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      if (!this.points) return false;
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;

                      let speed = 0;
                      let rawDir = null;

                      this.points.forEach(p => {
                        if (p.series.name === 'Viento') speed = p.y || 0;
                        else if (p.series.name === 'Dirección') rawDir = p.point?.windDir;
                      });

                      // Fallback: acceder a los datos del scatter directamente via API del chart
                      if (rawDir === null && pointIdx !== undefined) {
                        const chartSeries = this.points?.[0]?.series?.chart?.series;
                        const dirSeries = chartSeries?.find(s => s.name === 'Dirección');
                        if (dirSeries?.data?.[pointIdx]) rawDir = dirSeries.data[pointIdx].windDir;
                      }

                      // Construir cardinal + grados
                      let cardinal = '-';
                      let degreesNum = null;
                      if (rawDir !== null && rawDir !== undefined && rawDir !== '') {
                        if (typeof rawDir === 'string' && isNaN(Number(rawDir))) {
                          cardinal = rawDir.toUpperCase().trim();
                          degreesNum = WIND_DIR_MAP[cardinal] ?? null;
                        } else {
                          degreesNum = Number(rawDir);
                          if (!isNaN(degreesNum)) {
                            const idx = Math.round(((degreesNum % 360) / 22.5)) % 16;
                            cardinal = WIND_DIRECTIONS[idx] || '-';
                          }
                        }
                      }
                      const dirStr = cardinal !== '-'
                        ? cardinal + (degreesNum !== null ? ' · ' + degreesNum.toFixed(0) + '°' : '')
                        : (degreesNum !== null ? degreesNum.toFixed(0) + '°' : '-');

                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      s += '<div style="padding:2px 0"><span style="color:#14b8a6">●</span> <b>Velocidad:</b> ' + speed.toFixed(1) + ' km/h</div>';
                      s += '<div style="padding:2px 0"><span style="color:#64748b">●</span> <b>Dirección:</b> ' + dirStr + '</div>';
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: {
                      marker: {
                        enabled: true,
                        radius: 5,
                        fillColor: '#14b8a6',
                        lineColor: '#0f766e',
                        lineWidth: 1,
                        states: { hover: { radius: 7 } }
                      },
                      lineWidth: 2,
                      enableMouseTracking: true,
                      zIndex: 3
                    },
                    scatter: {
                      enableMouseTracking: false,
                      marker: { symbol: 'triangle', radius: 5 },
                      dataLabels: {
                        enabled: true,
                        useHTML: true,
                        formatter: function() {
                          const cardinal = this.point.cardinal || '';
                          const raw = this.point.windDir;
                          const deg = (raw !== null && raw !== undefined && !isNaN(Number(raw)))
                            ? Math.round(Number(raw)) + '°' : '';
                          if (!cardinal && !deg) return '';
                          return '<div style="text-align:center;font-size:12px;font-weight:bold;color:#64748b;line-height:1.3;text-shadow:1px 1px 0 white,-1px -1px 0 white,1px -1px 0 white,-1px 1px 0 white">' +
                            cardinal + (deg ? '<br/><span style="font-size:11px">' + deg + '</span>' : '') + '</div>';
                        },
                        style: {
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#64748b',
                          textOutline: '1px white'
                        },
                        y: -32
                      }
                    }
                  },
                  series: [
                    { name: 'Viento', data: data.map(d => d.wswdat_wind_speed_kmh), type: 'spline', color: '#14b8a6', zIndex: 3 },
                    { 
                      name: 'Dirección', 
                      data: data.map((d, i) => {
                        const raw = rawQueryData.find((item) => {
                          const itemTimestamp = parseLocalDate(item.wswdat_report_date).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          });
                          return itemTimestamp === d.timestamp;
                        });
                        const dir = raw?.wswdat_wind_degrees || raw?.wswdat_wind_dir;
                        const cardinal = dir ? degreesToDirection(dir) : '';
                        return {
                          x: i,
                          y: d.wswdat_wind_speed_kmh || 0,
                          cardinal: cardinal,
                          windDir: dir,
                          marker: {
                            symbol: 'triangle',
                            fillColor: '#64748b',
                            lineColor: '#64748b',
                            radius: 5,
                            rotation: dir ? -dir : 0
                          }
                        };
                      }), 
                      type: 'scatter', 
                      color: '#64748b',
                      zIndex: 3
                    }
                  ]
                }}
              />
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Dirección:</span>
                  <span>Indica de dónde viene el viento</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-gray-500"></span>
                  <span>N (0°)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-[8px] h-0 border-b-[5px] border-b-transparent border-t-[5px] border-t-transparent border-l-[8px] border-l-gray-500"></span>
                  <span>E (90°)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-gray-500"></span>
                  <span>S (180°)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-[8px] h-0 border-b-[5px] border-b-transparent border-t-[5px] border-t-transparent border-r-[8px] border-r-gray-500"></span>
                  <span>O (270°)</span>
                </div>
              </div>
            </div>
            )}

            {/* UV & Solar Radiation Chart */}
            {(hasValidData(data, 'wswdat_uv_index') || hasValidData(data, 'wswdat_solar_rad_wm2')) && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Índice UV y Radiación Solar
              </h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 280 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: [{ 
                    title: { text: 'UV' },
                    opposite: false,
                    min: 0
                  }, {
                    title: { text: 'W/m²' },
                    opposite: true,
                    min: 0
                  }],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;
                      const units = { 'UV Index': '', 'Radiación Solar': 'W/m²' };
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      this.points.forEach(p => {
                        const val = p.y !== null && p.y !== undefined ? p.y.toFixed(1) : '-';
                        const unit = units[p.series.name] ?? '';
                        s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + (unit ? ' ' + unit : '') + '</div>';
                      });
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: { marker: { enabled: true } },
                    column: { borderWidth: 0, borderRadius: 2 }
                  },
                  series: [
                    { name: 'UV Index', data: data.map(d => d.wswdat_uv_index), type: 'spline', color: '#eab308', yAxis: 0 },
                    { name: 'Radiación Solar', data: data.map(d => d.wswdat_solar_rad_wm2), type: 'column', color: '#f97316', yAxis: 1, fillOpacity: 0.6 }
                  ]
                }}
              />
            </div>
            )}

            {/* Precipitation + ETO Chart */}
            {(hasValidData(data, 'wswdat_precip_today_mm') || hasValidData(data, 'wswdat_eto_mm')) && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-500" />
                Precipitación y ETO
              </h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 220 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: [
                    { title: { text: 'Precipitación (mm)' }, min: 0 },
                    { title: { text: 'ETO (mm)' }, opposite: true, min: 0 }
                  ],
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      if (!this.points) return false;
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      this.points.forEach(p => {
                        const val = p.y !== null && p.y !== undefined ? p.y.toFixed(2) : '-';
                        s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + ' mm</div>';
                      });
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    column: { borderWidth: 0, borderRadius: 2 },
                    spline: { marker: { enabled: false } }
                  },
                  series: [
                    { name: 'Precipitación', data: data.map(d => d.wswdat_precip_today_mm || 0), type: 'column', color: '#3b82f6', yAxis: 0 },
                    { name: 'ETO', data: data.map(d => d.wswdat_eto_mm ?? null), type: 'spline', color: '#10b981', yAxis: 1, dashStyle: 'ShortDash' }
                  ]
                }}
              />
            </div>
            )}

            {/* Pressure Chart */}
            {hasValidData(data, 'wswdat_pressure_rel_hpa') && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Presión Atmosférica
              </h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 200 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: { 
                    title: { text: 'hPa' }
                  },
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      this.points.forEach(p => {
                        const val = p.y !== null && p.y !== undefined ? p.y.toFixed(1) : '-';
                        s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + ' hPa</div>';
                      });
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: { marker: { enabled: true } }
                  },
                  series: [
                    { name: 'Presión', data: data.map(d => d.wswdat_pressure_rel_hpa), type: 'spline', color: '#8b5cf6' }
                  ]
                }}
              />
            </div>
            )}

            {/* Dew Point Chart */}
            {hasValidData(data, 'wswdat_dewpoint_c') && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Cloud className="h-5 w-5 text-cyan-500" />
                Punto de Rocío
              </h3>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { height: 200 },
                  title: { text: '' },
                  xAxis: { categories: data.map(d => d.timestamp) },
                  yAxis: { 
                    title: { text: '°C' }
                  },
                  credits: { enabled: false },
                  tooltip: {
                    shared: true,
                    useHTML: true,
                    formatter: function() {
                      const pointIdx = this.points?.[0]?.point?.index;
                      const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                      const dateLabel = d?.timestamp || this.x;
                      let s = '<div style="font-size:12px;padding:6px 8px;min-width:200px">';
                      s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                      this.points.forEach(p => {
                        const val = p.y !== null && p.y !== undefined ? p.y.toFixed(1) : '-';
                        s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + ' °C</div>';
                      });
                      s += '</div>';
                      return s;
                    }
                  },
                  plotOptions: {
                    spline: { marker: { enabled: true } }
                  },
                  series: [
                    { name: 'Punto de Rocío', data: data.map(d => d.wswdat_dewpoint_c), type: 'spline', color: '#06b6d4' }
                  ]
                }}
              />
            </div>
            )}
          </div>

          {/* Sensor Charts */}
          {sensors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className="h-5 w-1 rounded-full bg-emerald-500"></div>
                <h2 className="text-lg font-bold text-gray-800">Sensores de la estación</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {sensors.length} sensor{sensors.length !== 1 ? 'es' : ''}
                </span>
              </div>
              {sensors.map(sensor => {
                const varInfo = SENSOR_VAR_MAP[(sensor.tipo_sensor || '').toLowerCase().trim()] || null;
                const seriesData = varInfo ? data.map(d => d[varInfo.key] ?? null) : null;
                const hasData = varInfo && seriesData && seriesData.some(v => v !== null && !isNaN(v));
                return (
                  <div key={sensor.sensor_id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{sensor.nombre_sensor}</h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            ID: {sensor.id_sensor}
                          </span>
                          {sensor.tipo_sensor && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              {sensor.tipo_sensor}
                            </span>
                          )}
                          {sensor.model_sensor && (
                            <span className="text-xs text-gray-400">{sensor.model_sensor}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasData ? (
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                          chart: { height: 200 },
                          title: { text: '' },
                          xAxis: { categories: data.map(d => d.timestamp) },
                          yAxis: { title: { text: varInfo.unit } },
                          credits: { enabled: false },
                          tooltip: {
                            shared: true,
                            useHTML: true,
                            formatter: function() {
                              const pointIdx = this.points?.[0]?.point?.index;
                              const d = (pointIdx !== undefined && data[pointIdx]) ? data[pointIdx] : null;
                              const dateLabel = d?.timestamp || this.x;
                              let s = '<div style="font-size:12px;padding:6px 8px;min-width:180px">';
                              s += '<div style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">📅 ' + dateLabel + '</div>';
                              this.points.forEach(p => {
                                const val = p.y !== null && p.y !== undefined ? p.y.toFixed(1) : '-';
                                s += '<div style="padding:2px 0"><span style="color:' + p.color + '">●</span> <b>' + p.series.name + ':</b> ' + val + (varInfo.unit ? ' ' + varInfo.unit : '') + '</div>';
                              });
                              s += '</div>';
                              return s;
                            }
                          },
                          plotOptions: { spline: { marker: { enabled: false } } },
                          series: [{
                            name: varInfo.label,
                            data: seriesData,
                            type: 'spline',
                            color: varInfo.color
                          }]
                        }}
                      />
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-sm bg-gray-50 rounded-lg">
                        {varInfo
                          ? 'Sin datos disponibles para este sensor en el período seleccionado'
                          : 'Tipo de sensor no reconocido para graficar'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showCharts && data.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No se encontraron datos para el rango de fechas seleccionado</p>
          <p className="text-gray-400 text-sm mt-2">Prueba con un rango de fechas diferente</p>
        </div>
      )}
    </div>
  );
};

export default DataQuery;
