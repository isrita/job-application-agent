**Perfil de la posición: ARQUITECTO DE DATOS Y IA (INTELIGENCIA ARTIFICIAL)**

- **Lambda / Event-driven:** He trabajado con arquitecturas basadas en eventos cuando diseñé pipelines para procesar grandes volúmenes de datos en tiempo real con Azure Event Hubs y Apache Kafka. Mi enfoque principal ha sido garantizar un procesamiento eficiente y escalable, aprovechando **Spark** en **Databricks** para orquestar tanto batch como streaming.
    
- **Microservicios:** He migrado y desarrollado sistemas desacoplados principalmente en Azure, combinando **Azure Kubernetes Service (AKS)** y **Azure Functions** para la lógica serverless. Esto brinda mayor resiliencia y facilita la evolución independiente de cada servicio.
    
- **CI/CD y automatización:** En lugar de Terraform, utilizo **Jenkins** para orquestar despliegues automatizados en la nube. Integro pruebas unitarias, validaciones de calidad y despliegues continuos de pipelines de datos y modelos de Machine Learning dentro de entornos de Azure.
    

---

### Plataformas y herramientas

- **Nube:** Mi especialización se centra en **Microsoft Azure** y **Databricks**. Tengo experiencia trabajando con servicios esenciales de Azure (como **Azure Data Factory**, **Azure Data Lake**, **Azure IoT Hub** y **Azure ML**). He experimentado en menor medida con AWS (EC2, S3, Lambda) y GCP, pero mi foco principal y certificaciones se ubican en el ecosistema de Azure.
    
- **Machine Learning:**
    
    - **Modelos de ML:** Implementación, monitoreo y reentrenamiento utilizando **Databricks**, **MLflow** y **Azure ML**. He desarrollado modelos de predicción para diferentes industrias, como el sector bancario (detección de anomalías) y el sector de telecomunicaciones (sistemas de recomendación).
    - **Visualización y monitoreo:** Empleo **Azure Monitor**, **Databricks Dashboards**, y ocasionalmente he trabajado con **Grafana** para métricas más especializadas.

---

### Monitoreo y gestión de modelos

- **Azure ML y MLflow:** Manejo del ciclo de vida completo de los modelos (entrenamiento, versionado, prueba y despliegue). He registrado modelos en MLflow para llevar control de versiones y facilitar la comparativa de resultados en proyectos de IA.
- **Reentrenamiento automatizado:** Configuro pipelines en Jenkins que, basados en las métricas de rendimiento (p. ej., precisión o error cuadrático medio), disparan tareas de retraining cuando el modelo comienza a decrecer en efectividad, garantizando un enfoque MLOps robusto.

---

## Preguntas de entrevista y respuestas ejemplificadas

1. **Menciona los 2 últimos proyectos de Datos que has realizado.**
    
    - **Proyecto de Migración de Oracle a Databricks:** Implementé una arquitectura de ingestión en tiempo real combinando Oracle LogMiner y Azure Event Hubs para enviar datos a **Databricks**. Mejoramos la disponibilidad de datos para reporting en un 30% y redujimos un 40% del tiempo de procesamiento.
    - **Anomalías en Banca con Spark:** Diseñé un pipeline en **Databricks** para detectar transacciones sospechosas en tiempo real. Empleamos MLflow para versionar modelos y un mecanismo de reentrenamiento continuo cuando las métricas de recall y precision caían por debajo de lo esperado.
2. **¿Qué arquitecturas has realizado con los chatbots? ¿Con qué inputs?**
    
    - Desarrollé un **chatbot legal** en **Microsoft Teams** usando **Azure Bot Service** y **Language Understanding (LUIS)** para procesar consultas internas y brindar acceso a documentación legal. Los inputs provenían de archivos SharePoint y bases de datos internas. Además, integré la lógica en microservicios con APIs en Python para procesar el lenguaje natural y extraer respuestas contextualizadas.
3. **¿Qué componentes has implementado como arquitecto?**
    
    - He diseñado la arquitectura completa de datos en Azure, con **Azure Data Factory** para orquestación, **Databricks** para ETL y análisis en batch/streaming, y **Azure Data Lake** para almacenamiento unificado. También configuré pipelines CI/CD con **Jenkins** para automatizar la entrega de componentes de datos y modelos de Machine Learning.
4. **¿Qué has visto y realizado en Databricks? ¿Qué modelos has implementado?**
    
    - En Databricks, he configurado flujos de ingestión desde Kafka, transformaciones con Spark SQL, y entrenado modelos de clasificación (Random Forest, XGBoost) y de regresión (Regresión Lineal, Decision Trees). He usado MLflow para trackear experimentos y parámetros, desde la fase de desarrollo hasta el despliegue.
5. **¿Has llegado a registrar modelos en Databricks y disponibilizarlos?**
    
    - Sí, uso **MLflow** para el registro de modelos directamente en Databricks. Posteriormente, los expongo mediante endpoints REST, integrados con Azure Functions o contenedores en AKS, según la necesidad del proyecto.
6. **¿Has realizado monitoreo de modelos?**
    
    - Sí, configuro dashboards en Databricks y Azure Monitor para métricas de inferencia (latencia, throughput) y métricas de rendimiento (accuracy, F1-score). También establezco alertas de Jenkins que disparan retraining cuando se supera un umbral de drift o bajan las métricas.
7. **¿Has utilizado Machine Learning? Spark? ¿Qué medidas de performance de modelo utilizas?**
    
    - Trabajo con Spark MLlib y scikit-learn, aplicando métricas como **MAE**, **RMSE**, **R²** para regresiones y **Precision**, **Recall**, **F1** para clasificación. Además, empleo AUC-ROC para validar la calidad de los modelos binarios.
8. **¿Has utilizado AWS o Kubernetes?**
    
    - Principalmente he trabajado con **Azure Kubernetes Service (AKS)** para contenedores, aunque tengo conocimiento básico de AWS (EC2, S3, Lambda) y Kubernetes vanilla. Sin embargo, mi fortaleza reside en Azure.
9. **¿Tienes certificado de AWS?**
    
    - No poseo certificaciones de AWS, pero sí **certificaciones de Azure** (DP-900 y DP-203) y **Databricks Certified Data Engineer Associate**.
10. **¿Has llegado a trabajar con flujos IaaS y SaaS de AWS? ¿Qué flujos has manejado?**
    
    - He estado involucrado en proyectos cortos de migración hacia AWS, principalmente conectando RDS con S3 y orquestando algunos jobs con AWS Glue, pero mi experiencia mayor es en Azure (IaaS con VMs, Storage Accounts y SaaS con servicios como Databricks en Azure).
11. **¿Has trabajado con MLOps?**
    
    - Sí, tengo experiencia en **MLOps** usando **Jenkins** para CI/CD, MLflow para versionado de modelos, y Azure DevOps para la automatización de pruebas y despliegues. Esto asegura la entrega continua y confiable de los modelos de IA.
12. **¿Trabajaste con Regresión Lineal? ¿Qué métricas utilizaste?**
    
    - He trabajado con Regresión Lineal en proyectos financieros y de predicción de series temporales. Utilizo métricas como **MSE**, **RMSE** y **R²** para evaluar la precisión de predicciones en ingresos y costos.
13. **¿Qué modelos has trabajado para clasificación?**
    
    - He implementado **Logistic Regression**, **Random Forest**, **XGBoost** y **SVM**. Selecciono el modelo en función de la naturaleza de los datos, optimizando hiperparámetros con herramientas como Hyperopt en Databricks.
14. **¿Qué tipo de arquitecturas conoces y has utilizado?**
    
    - He utilizado arquitecturas **Lambda** y **Kappa** para procesamiento de datos en tiempo real, así como arquitecturas basadas en microservicios. También he trabajado con data lakehouses en Databricks y Azure Synapse.
15. **¿Has implementado política de datos? ¿Qué principios básicos para asignación de acciones?**
    
    - Sí, en proyectos con **Azure Purview** he definido políticas de acceso basadas en **RBAC (Role-Based Access Control)** y el principio de **menor privilegio**, garantizando el cumplimiento de estándares de seguridad y protección de datos sensibles.
16. **¿Has hecho algún despliegue con Terraform?**
    
    - Por ahora, mi enfoque está en **Jenkins** para la automatización. No obstante, conozco los fundamentos de IaC (Infrastructure as Code) y puedo adaptar scripts de Terraform si el proyecto lo requiere.
17. **Si te dijera ahora, puedes crear una arquitectura de un asistente virtual, ¿puedes hacerlo? ¿Cómo lo harías?**
    
    - Diseñaría la solución en **Azure**, usando **Azure Bot Service** y **LUIS** o **Azure Cognitive Services** para el procesamiento de lenguaje natural. El flujo de datos lo manejaría con **Azure Functions** y un pipeline de CI/CD en **Jenkins** para despliegues automáticos.
    - Para el almacenamiento de información y entrenamiento del modelo, emplearía **Databricks** y **MLflow** para versionar y trackear experimentos. Finalmente, la orquestación y la monitorización la soportaría con **Azure Monitor** y notificaciones a través de Teams o Slack.


"Muchas gracias por su tiempo y por la oportunidad de conversar sobre mi experiencia y mi pasión por la arquitectura de datos e inteligencia artificial. Me entusiasma la posibilidad de colaborar con su equipo y aportar mi enfoque multidisciplinario para impulsar proyectos de alto impacto. Sin duda, quedo a su disposición para cualquier otra consulta o proceso que consideren necesario."

**Pregunta para generar interés y conocer más de la empresa:**  
"¿Cómo mide su organización el éxito de los proyectos de IA y qué oportunidades de crecimiento ofrecen a los profesionales que lideran estas iniciativas dentro de la compañía?"