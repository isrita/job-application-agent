## Entendimiento del proceso

**Qué hace el Excel hoy:**

|Función VBA|Qué hace|Equivalente Databricks|
|---|---|---|
|`DBInicio()`|Conecta a SQL Server via ADODB|Databricks ODBC + REST API|
|`LeeUltimoProceso()`|Lee registros pendientes por fuente/hoja|SELECT en tablas silver agg|
|`ConciliacionManual()`|Usuario asigna `num_movimiento` → UPDATE en tabla fuente|UPDATE en `s_mov_pax_{fuente}_agg`|
|`ReprocesaFuente()`|Llama SP `usp_dair_pcs_etl_pasajeros_concilia`|Trigger `nb_concilia_{fuente}` + `nb_update_s_mov_flight`|
|`CierraPeriodo()`|Llama SP `usp_dair_tbl_hst_periodo_abierto_upd`|UPSERT en `s_open_period`|
|`GeneraResumen()`|Llama SP `usp_dair_pcs_fact_mov_operacion_genera`|Trigger notebooks gold|
|`LeeSAP()`|Ejecuta job `DAIR_05SAP_OA`|Trigger Databricks Job AODB/ERP|

**Mapeo de tablas SQL Server → Databricks:**

|SQL Server|Databricks Silver|
|---|---|
|`dpax_src_tuua`|`slv_dev.pax.s_mov_pax_tuua_agg`|
|`dpax_src_migraciones`|`slv_dev.pax.s_mov_pax_migraciones_agg`|
|`dpax_src_dgac`|`slv_dev.pax.s_mov_pax_dgac_agg`|
|`dpax_src_conexion`|`slv_dev.pax.s_mov_pax_conexion_agg`|
|`dair_hst_movimiento_operacion`|`slv_dev.aviation.s_mov_flight`|
|`dair_hst_periodo_abierto`|`slv_dev.pax.s_open_period`|

**Columna clave:** `num_movimiento` → `aircraft_mov_erp`

---

## Observaciones importantes del código

1. **Credenciales hardcodeadas en el VBA** (`pass = "K2VKUhrxH1"`) — esto debe eliminarse; en Databricks se usa un **PAT (Personal Access Token)** o Azure Key Vault.
    
2. **Flujo conciliación manual:**
    
    - El usuario ve registros donde `aircraft_mov_erp = 0` en la hoja
    - Escribe un número > 99 en la columna `MovimientoOA` → asigna el vuelo
    - Escribe `100` → desconcilia (reset a 0)
    - El VBA hace UPDATE en la tabla fuente + llama al SP de conciliación
    - La **ventana de búsqueda** (`uf_vuelos_salida`) lee `s_mov_flight` para mostrar vuelos posibles al escribir `1`
3. **Dos modos** en TUUA: conciliar vs desconciliar (`cb_conc` checkbox)
    
4. **Conexiones** tiene lógica distinta: actualiza `num_movimiento_proc` y `num_movimiento_dest` por separado.
    

---

## Plan de trabajo — 5 fases

### Fase 1 — Conexión desde Excel a Databricks _(base de todo)_

- Instalar **Databricks ODBC Driver** en máquinas de usuarios
- Reemplazar `DBInicio()`: `Provider=SQLOLEDB` → `Provider=MSDASQL` con DSN Databricks
- Para triggers de notebooks: llamadas HTTP a **Databricks REST API** (`/api/2.1/jobs/run-now`) desde VBA usando `WinHttp.WinHttpRequest`
- Credenciales: **PAT token** almacenado en Windows Credential Manager (no hardcodeado)

### Fase 2 — Gestión de periodos `nb_open_period`

- Notebook nuevo en `shared/` que replica `usp_dair_tbl_hst_periodo_abierto_upd`
- UPSERT en `s_open_period`: si existe el periodo → UPDATE; si no → INSERT
- Parámetros widget: `nb_periodo`, `nb_fuente` (OA/TUUA/DGAC/MIGR/CONEX/ALL), `nb_estado` (true/false)
- `CierraPeriodo()` en VBA → llama este notebook via REST API

### Fase 3 — Lectura de datos (`LeeUltimoProceso`)

- Actualizar los 5 SELECT del VBA (DGAC, TUUA, Migraciones, Conexiones, OA) con los nuevos nombres de tabla y columnas de Databricks
- Misma lógica de filtros (`aircraft_mov_erp = 0`, periodo, etc.)
- Sigue usando ODBC → `HojaActual.CopyFromRecordset` igual que hoy

### Fase 4 — Conciliación manual (`ConciliacionManual` + form)

- `ConciliacionManual()`: UPDATE via ODBC sobre `s_mov_pax_{fuente}_agg` (`aircraft_mov_erp`, `obs='MANUAL'`)
- Después del UPDATE: trigger `nb_concilia_{fuente}` + `nb_update_s_mov_flight` via REST API
- Form `uf_vuelos_salida`: reescribir SELECT para leer `s_mov_flight` con columnas DLH
- Agregar columna `aircraft_mov_erp` junto a `aircraft_mov_aodb` en el Excel fuente _(nota para el equipo de estadística)_

### Fase 5 — Resumen y gold (`GeneraResumen`)

- `GeneraResumen()`: trigger notebooks gold via REST API (reemplaza `usp_dair_pcs_fact_mov_operacion_genera`)
- `LeeSAP()`: trigger Databricks Job AODB/ERP (reemplaza `DAIR_05SAP_OA`)

---

## Pasos en orden para arrancar

```
PASO 1 — Tú (esta semana)
  ├── Crear el SQL Warehouse en Databricks
  ├── Generar el PAT token
  └── Guardar el PAT en Azure Key Vault

PASO 2 — Hablar con IT
  ├── Instalar Databricks ODBC Driver en las laptops
  ├── Dar permisos en el SQL Warehouse
  └── Dar permisos GRANT en las tablas silver

PASO 3 — Validar la conexión (antes de tocar el VBA)
  └── Probar el ODBC desde Windows manualmente:
      Panel de Control → Herramientas Administrativas
      → Orígenes de datos ODBC → Agregar → Simba Spark ODBC
      → Poner el hostname, HTTP path y el PAT como contraseña
      → Test Connection → debe decir "Success"

PASO 4 — Migrar el VBA
  ├── Reemplazar DBInicio() con el nuevo string de Databricks
  ├── Actualizar nombres de tabla en LeeUltimoProceso()
  └── Agregar la función TriggerNotebook() para los botones

PASO 5 — Crear nb_open_period
  └── El notebook que reemplaza al SP de abrir/cerrar periodos
```

---

