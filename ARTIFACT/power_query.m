// ===== Performance - Data Base PA
let
    Origen = Excel.Workbook(File.Contents("C:\Users\Sebastian Carrillo\OneDrive - Grupo Orion\Documentos\Business Intelligence\Performance-Report-Puerta-Abierta.xlsx"), null, true),
    #"Performance - Data Base PA_Sheet" = Origen{[Item="Performance - Data Base PA",Kind="Sheet"]}[Data],
    #"Encabezados promovidos" = Table.PromoteHeaders(#"Performance - Data Base PA_Sheet", [PromoteAllScalars=true]),
    #"Tipo cambiado" = Table.TransformColumnTypes(#"Encabezados promovidos",{{"Fecha", type date}, {"Nombre de la cuenta", type text}, {"Nombre de la campaña", type text}, {"Alcance", Int64.Type}, {"Impresiones", Int64.Type}, {"Clientes potenciales", Int64.Type}, {"Divisa", type text}, {"Costo por cliente potencial", type number}, {"CTR (todos)", type number}, {"Frecuencia", type number}, {"Clics (todos)", Int64.Type}, {"CPC (todos)", type number}, {"Importe gastado (USD)", type number}, {"Configuración de atribución", type text}, {"Presupuesto de la campaña", type any}, {"Tipo de presupuesto de la campaña", type text}, {"Presupuesto del conjunto de anuncios", type text}, {"Tipo de presupuesto del conjunto de anuncios", type text}, {"Inicio del informe", type date}, {"Fin del informe", type date}})
in
    #"Tipo cambiado"

// ===== insights list
let
    Origen = Excel.Workbook(File.Contents("C:\Users\Sebastian Carrillo\OneDrive - Grupo Orion\Documentos\Business Intelligence\Reservas Totales PA - Report.xlsx"), null, true),
    #"insights list_Sheet" = Origen{[Item="insights list",Kind="Sheet"]}[Data],
    #"Encabezados promovidos" = Table.PromoteHeaders(#"insights list_Sheet", [PromoteAllScalars=true]),
    #"Tipo cambiado" = Table.TransformColumnTypes(#"Encabezados promovidos",{{"Asunto", type text}, {"Tipo", type text}, {"Asignado al usuario", type text}, {"Estado", type text}, {"Hora de añadición", type datetime}, {"Fecha de vencimiento", type date}, {"Trato", type text}, {"Proyecto", type text}, {"Fuente - Trato", type text}, {"Fuente - Persona", type text}, {"[Meta] Campaign Name", type text}, {"[Meta] Ad Name", type text}, {"Etapa", type text}}),
    #"Columnas con nombre cambiado" = Table.RenameColumns(#"Tipo cambiado",{{"Hora de añadición", "Fecha de añadición"}})
in
    #"Columnas con nombre cambiado"

// ===== Inventarios
let
    Origen = Excel.Workbook(File.Contents("C:\Users\Sebastian Carrillo\OneDrive - Grupo Orion\Documentos\Business Intelligence\Análisis de Inventarios.xlsx"), null, true),
    Inventarios_Sheet = Origen{[Item="Inventarios",Kind="Sheet"]}[Data],
    #"Encabezados promovidos" = Table.PromoteHeaders(Inventarios_Sheet, [PromoteAllScalars=true]),
    #"Tipo cambiado" = Table.TransformColumnTypes(#"Encabezados promovidos",{{"Proyecto", type text}, {"Nivel", type text}, {"Número ", Int64.Type}, {"Tipo", type text}, {"M² ", type number}, {"Habitaciones", Int64.Type}, {"No. Bodega  5mts", Int64.Type}, {"Balcon", type number}, {"Jardín", Int64.Type}, {"Parqueos ", Int64.Type}, {"Parqueo Tandem", Int64.Type}, {"Bodega No. ", Int64.Type}, {"Bodega #(lf)NUEVA UBICACIÓN", Int64.Type}, {"Comparativa Bodegas ", type text}, {"Sotano y parqueo", type text}, {"Sótano y parqueo", type text}, {"Sótano y parqueo NUEVA UBICACIÓN", type text}, {"Comparativa Sótanos", type text}, {"Q/M2", type number}, {"Precio sin imp ", type number}, {"Precio (Impuestos)", type number}, {"Precio sin imp FHA", type number}, {"Aproximacion - FHA", Int64.Type}, {"Ajuste 1", Int64.Type}, {"Precio de Venta", Int64.Type}, {"Estatus", type text}, {"Fecha de reserva", type date}, {"Column28", type any}, {"Column29", type any}, {"Column30", type any}, {"Column31", type text}})
in
    #"Tipo cambiado"

// ===== Presupuesto
let
    Origen = Excel.Workbook(File.Contents("C:\Users\Sebastian Carrillo\OneDrive - Grupo Orion\Documentos\Business Intelligence\Presupuestos - Puerta Abierta.xlsx"), null, true),
    Presupuesto_Sheet = Origen{[Item="Presupuesto",Kind="Sheet"]}[Data],
    #"Encabezados promovidos" = Table.PromoteHeaders(Presupuesto_Sheet, [PromoteAllScalars=true]),
    #"Tipo cambiado" = Table.TransformColumnTypes(#"Encabezados promovidos",{{"Fecha", type any}, {"Mes", type text}, {"Proyecto", type text}, {"Concepto", type text}, {"Proveedor", type text}, {"Inversión", type number}, {"Tipología", type text}, {"Frecuencia", type text}, {"Responsable", type text}})
in
    #"Tipo cambiado"

