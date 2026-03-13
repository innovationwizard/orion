-- ==========================================================================
-- Backfill: Cesion de Derechos — Boulevard 5
-- Source: ACTUALIZACION APTOS CESION DE DERECHOS BOULEVARD 5 Vrs.030326.xlsx
-- Records: 279
-- ==========================================================================

BEGIN;

-- Pre-flight: verify all target units exist in rv_units for B5
DO $$ BEGIN
  IF (
    SELECT count(*) FROM rv_units ru
    JOIN floors f ON f.id = ru.floor_id
    JOIN towers t ON t.id = f.tower_id
    WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
    AND ru.unit_number IN ('1905', '1903', '1902', '1904', '1409', '920', '912', '1012', '1607', '1107', '103', '1608', '1508', '1008', '1801', '1807', '1307', '615', '1503', '1403', '1504', '1207', '309', '1706', '418', '102', '1701', '114', '405', '901', '1017', '1212', '1501', '708', '608', '617', '711', '1116', '514', '1019', '611', '1707', '1011', '305', '1016', '1201', '408', '1404', '619', '804', '919', '817', '612', '302', '813', '1205', '1609', '315', '1001', '1315', '1509', '1804', '706', '705', '713', '205', '1610', '1412', '1218', '1806', '1406', '715', '1704', '707', '1216', '814', '1316', '510', '803', '1112', '1002', '805', '101', '213', '810', '1118', '1312', '1611', '1507', '506', '1310', '1111', '410', '406', '913', '812', '1510', '419', '109', '212', '113', '1302', '915', '1020', '1115', '209', '1705', '709', '312', '906', '407', '314', '210', '308', '204', '503', '111', '1605', '519', '602', '1318', '318', '618', '518', '106', '606', '1014', '1402', '908', '301', '719', '304', '416', '1311', '313', '1117', '1604', '806', '703', '1007', '1303', '907', '1103', '1110', '616', '808', '1204', '1104', '702', '909', '604', '717', '414', '411', '413', '504', '412', '306', '307', '311', '415', '501', '1502', '605', '1202', '1217', '1301', '1101', '1808', '716', '704', '905', '1006', '1304', '320', '1411', '809', '420', '417', '402', '1405', '903', '1209', '1314', '104', '820', '818', '1013', '701', '609', '1211', '819', '216', '1102', '517', '1005', '710', '1109', '614', '516', '914', '918', '601', '509', '610', '1203', '807', '1308', '902', '1702', '801', '1407', '1009', '401', '202', '1601', '409', '215', '1511', '1410', '1215', '214', '404', '317', '316', '1401', '613', '1505', '505', '1317', '916', '1306', '917', '513', '802', '712', '1003', '512', '507', '603', '1206', '1004', '1708', '1015', '911', '508', '815', '904', '1703', '1018', '607', '511', '1802', '1010', '811', '515', '1208', '1210', '816', '319', '1106', '714', '1214', '1305', '1603', '1313', '1602', '1113', '1612', '1213', '1105', '1114', '110', '112', '1408', '1805', '1803', '207', '718')
  ) < 279
  THEN RAISE EXCEPTION
    'Pre-flight failed: expected 279 B5 units, found fewer. Aborting.';
  END IF;
END $$;

-- [1/279] Unit 1905
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1433300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1905'
);

-- [2/279] Unit 1903
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1903'
);

-- [3/279] Unit 1902
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1392100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1902'
);

-- [4/279] Unit 1904
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1392100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1904'
);

-- [5/279] Unit 1409
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1409'
);

-- [6/279] Unit 920
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1135500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '920'
);

-- [7/279] Unit 912
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1188200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '912'
);

-- [8/279] Unit 1012
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1188200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1012'
);

-- [9/279] Unit 1607
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1395200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1607'
);

-- [10/279] Unit 1107
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1107'
);

-- [11/279] Unit 103
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1814200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '103'
);

-- [12/279] Unit 1608
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1397100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1608'
);

-- [13/279] Unit 1508
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1397100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1508'
);

-- [14/279] Unit 1008
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1008'
);

-- [15/279] Unit 1801
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1560800.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1801'
);

-- [16/279] Unit 1807
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1370600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1807'
);

-- [17/279] Unit 1307
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1307'
);

-- [18/279] Unit 615
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 850300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '615'
);

-- [19/279] Unit 1503
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1503'
);

-- [20/279] Unit 1403
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1403'
);

-- [21/279] Unit 1504
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1504'
);

-- [22/279] Unit 1207
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1207'
);

-- [23/279] Unit 309
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 74% (Dos Crédito Hipotecario 1 millón y 260 mil, Crédito Prendario Q131 mil y TC Q89 mil), se sugiere adicionar otro deudor.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '309'
);

-- [24/279] Unit 1706
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1706'
);

-- [25/279] Unit 418
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '418'
);

-- [26/279] Unit 102
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1240700.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '102'
);

-- [27/279] Unit 1701
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 59% (Adicionar otro deudor)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1701'
);

-- [28/279] Unit 114
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1362100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '114'
);

-- [29/279] Unit 405
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1102100.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '405'
);

-- [30/279] Unit 901
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1335600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '901'
);

-- [31/279] Unit 1017
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1017'
);

-- [32/279] Unit 1212
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 51% (Creidtos Hipotecarios por Q2.3 millones y TCs por Q377 mil) Presentar contratos de arrendamiento, o bajar deuda.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1212'
);

-- [33/279] Unit 1501
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351400.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1501'
);

-- [34/279] Unit 708
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '708'
);

-- [35/279] Unit 608
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Condicionada a que Alfonso Videche presente finiquito por calificación D de la SIB en junio 2025.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '608'
);

-- [36/279] Unit 617
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '617'
);

-- [37/279] Unit 711
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '711'
);

-- [38/279] Unit 1116
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Segundo deudor categoría E en la SIB, adicional posee un cobro judicial en Banco Industrial',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1116'
);

-- [39/279] Unit 514
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI superior al 100% (cuenta incobrable con Credomatic  por Q60 mil y saldos en TCs por Q87 mil), Se sugiere adicionar otro deudor y presentar finiquito.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '514'
);

-- [40/279] Unit 1019
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1127700.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 65% (Fiduciario por Q90 mil y TC por Q32 mil) adicionar otro deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1019'
);

-- [41/279] Unit 611
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente no posee NIT, guatemalteco en el Extranjero.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '611'
);

-- [42/279] Unit 1707
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1092200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1707'
);

-- [43/279] Unit 1011
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1191700.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1011'
);

-- [44/279] Unit 305
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1102100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '305'
);

-- [45/279] Unit 1016
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 51% (Creidtos Hipotecarios por Q2.3 millones y TCs por Q377 mil) Presentar contratos de arrendamiento, o bajar deuda.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1016'
);

-- [46/279] Unit 1201
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1372600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (TCs por Q318 mil y una cuenta incobrable por Q7 mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1201'
);

-- [47/279] Unit 408
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '408'
);

-- [48/279] Unit 1404
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI superior al 100%',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1404'
);

-- [49/279] Unit 619
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1532700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '619'
);

-- [50/279] Unit 804
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '804'
);

-- [51/279] Unit 919
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1127700.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (TCs Q1.2 millones y credito hipotecario Q476 mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '919'
);

-- [52/279] Unit 817
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 75% (Credito hipotecario por Q905 mil y TCs por Q62 mil) se sugiere adicionar otro deudor.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '817'
);

-- [53/279] Unit 612
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee dos juicios, uno de Urgencia de providencia y otro tipo ejecutivo, ambos de la SAT. Adjuntar desistimientos.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '612'
);

-- [54/279] Unit 302
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1345800.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '302'
);

-- [55/279] Unit 813
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '813'
);

-- [56/279] Unit 1205
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (Fiduciario por Q219mil y TCs por Q96mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1205'
);

-- [57/279] Unit 1609
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente es calificación B y C, presentar finiquito y  posee una cuenta en Cobro Judicial de Banco Industrial',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1609'
);

-- [58/279] Unit 315
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1566900.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '315'
);

-- [59/279] Unit 1001
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1335600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 52% (TCs por Q45 mil) adicionar otro deudor, incrementar ingresos / enganche o cancelar deuda.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1001'
);

-- [60/279] Unit 1315
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1315'
);

-- [61/279] Unit 1509
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1509'
);

-- [62/279] Unit 1804
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 850300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 59% endeudamiento principal de: Prendario por Q341 mil, hipotecario Q197 mil y TCs por Q30 mil',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1804'
);

-- [63/279] Unit 706
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1433300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '706'
);

-- [64/279] Unit 705
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1427500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 55% (Crédito prendario Q273 mil y TC por Q33 mil) se sugiere adicionar otro deudor.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '705'
);

-- [65/279] Unit 713
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '713'
);

-- [66/279] Unit 205
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '205'
);

-- [67/279] Unit 1610
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1610'
);

-- [68/279] Unit 1412
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 93% (Adicionar otro deudor o cancelar deudas)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1412'
);

-- [69/279] Unit 1218
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1370700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1218'
);

-- [70/279] Unit 1806
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1806'
);

-- [71/279] Unit 1406
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1406'
);

-- [72/279] Unit 715
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 850300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 59% endeudamiento principal de: Prendario por Q341 mil, hipotecario Q197 mil y TCs por Q30 mil',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '715'
);

-- [73/279] Unit 1704
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 850300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 93% (Adicionar otro deudor o cancelar deudas)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1704'
);

-- [74/279] Unit 707
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '707'
);

-- [75/279] Unit 1216
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1216'
);

-- [76/279] Unit 814
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes poseen un RCI del 68% (Enma Lopez crédito fiduciario por Q96 mil y TCs por Q119 mil, Joselin Tercero TCs por Q48.8 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '814'
);

-- [77/279] Unit 1316
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1316'
);

-- [78/279] Unit 510
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '510'
);

-- [79/279] Unit 803
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 75% (Hipotecario por Q664 mil, prendario por Q140 mil y TC´s por Q311 mil) Adicionar otro deudor o cancelar deudas',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '803'
);

-- [80/279] Unit 1112
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1112'
);

-- [81/279] Unit 1002
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351500.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1002'
);

-- [82/279] Unit 805
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1092200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '805'
);

-- [83/279] Unit 101
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 977300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '101'
);

-- [84/279] Unit 213
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '213'
);

-- [85/279] Unit 810
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes poseen un RCI del 51% (Wendy Barillas posee TC con Q150 mil) Incrementar ingresos o cancelar deuda',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '810'
);

-- [86/279] Unit 1118
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1300600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1118'
);

-- [87/279] Unit 1312
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1312'
);

-- [88/279] Unit 1611
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1611'
);

-- [89/279] Unit 1507
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1395200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1507'
);

-- [90/279] Unit 506
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1433300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 60%, se sugiere aumentar ingresos, cancelar tarjetas de crédito o adicionar un segundo deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '506'
);

-- [91/279] Unit 1310
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1310'
);

-- [92/279] Unit 1111
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1111'
);

-- [93/279] Unit 410
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1143100.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '410'
);

-- [94/279] Unit 406
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '406'
);

-- [95/279] Unit 913
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '913'
);

-- [96/279] Unit 812
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '812'
);

-- [97/279] Unit 1510
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 57%',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1510'
);

-- [98/279] Unit 419
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1124700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '419'
);

-- [99/279] Unit 109
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1742900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '109'
);

-- [100/279] Unit 212
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '212'
);

-- [101/279] Unit 113
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1323600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '113'
);

-- [102/279] Unit 1302
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1370700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Presentar finiquitos',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1302'
);

-- [103/279] Unit 915
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1507400.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 53% (Credito Hipotecario Q787 mil y TCs por Q544 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '915'
);

-- [104/279] Unit 1020
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1135500.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1020'
);

-- [105/279] Unit 1115
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1115'
);

-- [106/279] Unit 209
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1216600.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '209'
);

-- [107/279] Unit 1705
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1705'
);

-- [108/279] Unit 709
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '709'
);

-- [109/279] Unit 312
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1397100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '312'
);

-- [110/279] Unit 906
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094400.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '906'
);

-- [111/279] Unit 407
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '407'
);

-- [112/279] Unit 314
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '314'
);

-- [113/279] Unit 210
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '210'
);

-- [114/279] Unit 308
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '308'
);

-- [115/279] Unit 204
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Cliente no posee record crediticio, Banco indica que no es un impedimiento para solicitar el crédito hipotecario.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '204'
);

-- [116/279] Unit 503
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '503'
);

-- [117/279] Unit 111
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1057300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 68% (Crédito hipotecario Q471mil y TCs por Q44 mil), se sugiere adicionar otro deudor.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '111'
);

-- [118/279] Unit 1605
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1605'
);

-- [119/279] Unit 519
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1532700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '519'
);

-- [120/279] Unit 602
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1532700.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '602'
);

-- [121/279] Unit 1318
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1370700.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1318'
);

-- [122/279] Unit 318
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente ahora no posee capacidad de pago, se recomienda adicionar un segundo deudor con Q8,000 libres.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '318'
);

-- [123/279] Unit 618
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '618'
);

-- [124/279] Unit 518
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '518'
);

-- [125/279] Unit 106
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1412100.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '106'
);

-- [126/279] Unit 606
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1433300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Aprobada Condicionada, no aumentar su RCI',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '606'
);

-- [127/279] Unit 1014
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superiror al 100% (3 creditos fiduciarios por Q800 mil y saldos vencidos en TC, adjuntar finiquito)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1014'
);

-- [128/279] Unit 1402
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1312300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1402'
);

-- [129/279] Unit 908
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (TCs por Q528 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '908'
);

-- [130/279] Unit 301
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1338500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '301'
);

-- [131/279] Unit 719
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1532700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '719'
);

-- [132/279] Unit 304
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '304'
);

-- [133/279] Unit 416
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '416'
);

-- [134/279] Unit 1311
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1137700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1311'
);

-- [135/279] Unit 313
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1216600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '313'
);

-- [136/279] Unit 1117
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1296500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1117'
);

-- [137/279] Unit 1604
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1604'
);

-- [138/279] Unit 806
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094400.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 51% (Presentar desistimientos de jucios Municipalidad de San Miguel Petapa), verificar si tiene ingresos extras.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '806'
);

-- [139/279] Unit 703
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '703'
);

-- [140/279] Unit 1007
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1007'
);

-- [141/279] Unit 1303
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1303'
);

-- [142/279] Unit 907
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '907'
);

-- [143/279] Unit 1103
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1103'
);

-- [144/279] Unit 1110
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (TCs por Q276 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1110'
);

-- [145/279] Unit 616
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '616'
);

-- [146/279] Unit 808
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '808'
);

-- [147/279] Unit 1204
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1204'
);

-- [148/279] Unit 1104
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1104'
);

-- [149/279] Unit 702
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1532700.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 55%, se sugieres incrementar ingresos o adicionar un segundo deudor.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '702'
);

-- [150/279] Unit 909
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente no posee NIT (Guatemalteco en el Extranjero)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '909'
);

-- [151/279] Unit 604
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '604'
);

-- [152/279] Unit 717
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '717'
);

-- [153/279] Unit 414
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '414'
);

-- [154/279] Unit 411
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1395200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '411'
);

-- [155/279] Unit 413
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '413'
);

-- [156/279] Unit 504
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '504'
);

-- [157/279] Unit 412
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1190200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 55%, se sugiere aumentar ingresos a Q17 mil o adicionar un segundo deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '412'
);

-- [158/279] Unit 306
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'DISPONIBLE',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '306'
);

-- [159/279] Unit 307
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '307'
);

-- [160/279] Unit 311
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1395200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '311'
);

-- [161/279] Unit 415
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1566900.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '415'
);

-- [162/279] Unit 501
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '501'
);

-- [163/279] Unit 1502
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1369700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1502'
);

-- [164/279] Unit 605
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1427500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '605'
);

-- [165/279] Unit 1202
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1370700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1202'
);

-- [166/279] Unit 1217
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1372600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1217'
);

-- [167/279] Unit 1301
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1372600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1301'
);

-- [168/279] Unit 1101
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1296500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1101'
);

-- [169/279] Unit 1808
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1549700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1808'
);

-- [170/279] Unit 716
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '716'
);

-- [171/279] Unit 704
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes no poseen capacidad de pago, segunda solicitante únicamente aplica 60 meses de crédito.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '704'
);

-- [172/279] Unit 905
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1092200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '905'
);

-- [173/279] Unit 1006
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1094400.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1006'
);

-- [174/279] Unit 1304
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1304'
);

-- [175/279] Unit 320
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1141600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '320'
);

-- [176/279] Unit 1411
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1411'
);

-- [177/279] Unit 809
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1566900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '809'
);

-- [178/279] Unit 420
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '420'
);

-- [179/279] Unit 417
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '417'
);

-- [180/279] Unit 402
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1345800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '402'
);

-- [181/279] Unit 1405
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1507400.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1405'
);

-- [182/279] Unit 903
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '903'
);

-- [183/279] Unit 1209
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 59% (TC por Q3.3 mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1209'
);

-- [184/279] Unit 1314
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1013200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1314'
);

-- [185/279] Unit 104
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1042200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 68% (Crédito hipotecario Q471mil y TCs por Q44 mil), se sugiere adicionar otro deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '104'
);

-- [186/279] Unit 820
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1135500.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '820'
);

-- [187/279] Unit 818
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '818'
);

-- [188/279] Unit 1013
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1013'
);

-- [189/279] Unit 701
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '701'
);

-- [190/279] Unit 609
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '609'
);

-- [191/279] Unit 1211
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1211'
);

-- [192/279] Unit 819
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1127700.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '819'
);

-- [193/279] Unit 216
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1141600.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '216'
);

-- [194/279] Unit 1102
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1300600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 58% (TC por Q87 mil) adicionar otro deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1102'
);

-- [195/279] Unit 517
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '517'
);

-- [196/279] Unit 1005
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1092200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1005'
);

-- [197/279] Unit 710
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '710'
);

-- [198/279] Unit 1109
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1109'
);

-- [199/279] Unit 614
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 52% se sugiere incrementar ingresos o adicionar segundo deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '614'
);

-- [200/279] Unit 516
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '516'
);

-- [201/279] Unit 914
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1028000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (TCs por Q394 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '914'
);

-- [202/279] Unit 918
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (Hipotecario por Q513 mil y TCs por Q207 mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '918'
);

-- [203/279] Unit 601
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 54% (TC por Q9.6 mil), se sugiere adicionar otro deudor o cancelar la deuda de la TC.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '601'
);

-- [204/279] Unit 509
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'condicionada a que Anabella Alburez presente finiquito por calificación C de la SIB en febrero 2025.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '509'
);

-- [205/279] Unit 610
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '610'
);

-- [206/279] Unit 1203
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1203'
);

-- [207/279] Unit 807
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI superior al 100% (Hipotecario por Q783 mil y TCs por Q36 mil) adicionar otro deudor o cancelar deudas.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '807'
);

-- [208/279] Unit 1308
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1308'
);

-- [209/279] Unit 902
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '902'
);

-- [210/279] Unit 1702
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 56% (Adicionar otro deudor)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1702'
);

-- [211/279] Unit 801
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1335600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '801'
);

-- [212/279] Unit 1407
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1258200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1407'
);

-- [213/279] Unit 1009
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1009'
);

-- [214/279] Unit 401
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1338500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '401'
);

-- [215/279] Unit 202
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1260000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '202'
);

-- [216/279] Unit 1601
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351400.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 51%',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1601'
);

-- [217/279] Unit 409
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 81% (Extrafinan por Q171 mil, Crédito Prendario por Q138 mil, fid. Prendario por Q113 mil, y TCs por Q30 mil), se sugiere adicionar segundo deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '409'
);

-- [218/279] Unit 215
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1124700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '215'
);

-- [219/279] Unit 1511
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes poseen un RCI superior al 100% (Luis Fernando: Fiduciario por Q276 mil y TCs por Q23 mil. Cristian: Hipotecario por Q1.2 millones y TCs por Q123 mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1511'
);

-- [220/279] Unit 1410
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1032600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1410'
);

-- [221/279] Unit 1215
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1215'
);

-- [222/279] Unit 214
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '214'
);

-- [223/279] Unit 404
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '404'
);

-- [224/279] Unit 317
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '317'
);

-- [225/279] Unit 316
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '316'
);

-- [226/279] Unit 1401
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1292100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 51%',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1401'
);

-- [227/279] Unit 613
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '613'
);

-- [228/279] Unit 1505
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 59%',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1505'
);

-- [229/279] Unit 505
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1427500.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '505'
);

-- [230/279] Unit 1317
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1372600.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Aristoteles Boror presentar desistimiento judicial o Finiquito',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1317'
);

-- [231/279] Unit 916
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '916'
);

-- [232/279] Unit 1306
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1306'
);

-- [233/279] Unit 917
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '917'
);

-- [234/279] Unit 513
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '513'
);

-- [235/279] Unit 802
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1351500.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 100% (Crédito Hipotecario Fiduciario por Q16.8 millones y dos Hipotecarios por Q2.4 millones)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '802'
);

-- [236/279] Unit 712
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '712'
);

-- [237/279] Unit 1003
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1003'
);

-- [238/279] Unit 512
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '512'
);

-- [239/279] Unit 507
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '507'
);

-- [240/279] Unit 603
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1046200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = 'Se adiciona segundo deudor. Resultado aprobado.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '603'
);

-- [241/279] Unit 1206
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1206'
);

-- [242/279] Unit 1004
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1004'
);

-- [243/279] Unit 1708
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1492200.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1708'
);

-- [244/279] Unit 1015
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1507400.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 59% (Fiduciario por Q624 mil y TC por Q160 mil) adicionar otro deudor, incrementar ingresos / enganche o cancelar deuda.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1015'
);

-- [245/279] Unit 911
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1191700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '911'
);

-- [246/279] Unit 508
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes poseen RCI del 71% (Evelyn Samayoa dos prestamos prendario por Q206 mil y TC por Q37.5 mil. Liza Samayoa tiene TC con Q7mil)',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '508'
);

-- [247/279] Unit 815
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1507400.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '815'
);

-- [248/279] Unit 904
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 912200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '904'
);

-- [249/279] Unit 1703
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1392100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee RCI del 62% (TC por Q14 mil)',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1703'
);

-- [250/279] Unit 1018
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 913900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1018'
);

-- [251/279] Unit 607
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 937100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Madlyn no posee NIT, Antony participando solo no tiene capacidad de pago.',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '607'
);

-- [252/279] Unit 511
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1347800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Clientes poseen RCI del 73% (Hugo Roca posee crédito Hipotecario por Q424 mil y otro prendario por Q136 mil y TCs por Q67 mil) cancelar deudas.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '511'
);

-- [253/279] Unit 1802
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1079200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1802'
);

-- [254/279] Unit 1010
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1079200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1010'
);

-- [255/279] Unit 811
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1102100.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '811'
);

-- [256/279] Unit 515
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 850300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '515'
);

-- [257/279] Unit 1208
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1208'
);

-- [258/279] Unit 1210
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1350000.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1210'
);

-- [259/279] Unit 816
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '816'
);

-- [260/279] Unit 319
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1124700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '319'
);

-- [261/279] Unit 1106
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 906600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1106'
);

-- [262/279] Unit 714
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1558800.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 53%',
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '714'
);

-- [263/279] Unit 1214
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1013200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 73% no registra Deuda en SIB, adicionar otro deudor',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1214'
);

-- [264/279] Unit 1305
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1305'
);

-- [265/279] Unit 1603
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1050600.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1603'
);

-- [266/279] Unit 1313
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1313'
);

-- [267/279] Unit 1602
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1369700.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'N/A',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CASO ESPECIAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1602'
);

-- [268/279] Unit 1113
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1113'
);

-- [269/279] Unit 1612
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1079200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'DISPONIBLE',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1612'
);

-- [270/279] Unit 1213
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 894300.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1213'
);

-- [271/279] Unit 1105
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 909200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1105'
);

-- [272/279] Unit 1114
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1013200.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1114'
);

-- [273/279] Unit 110
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1026900.0,
  is_cesion               = true,
  pcv_block               = 2,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '110'
);

-- [274/279] Unit 112
UPDATE rv_units SET
  parking_car_area        = 12.5,
  parking_tandem_area     = 0.0,
  price_suggested         = 1058200.0,
  is_cesion               = true,
  pcv_block               = 1,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'INVERSIÓN',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '112'
);

-- [275/279] Unit 1408
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1260200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'DISPONIBLE',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1408'
);

-- [276/279] Unit 1805
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1396200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1805'
);

-- [277/279] Unit 1803
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1392100.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'APROBADA',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '1803'
);

-- [278/279] Unit 207
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1395200.0,
  is_cesion               = true,
  pcv_block               = 4,
  precalificacion_status  = 'DISPONIBLE',
  precalificacion_notes   = NULL,
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '207'
);

-- [279/279] Unit 718
UPDATE rv_units SET
  parking_car_area        = 0.0,
  parking_tandem_area     = 25.0,
  price_suggested         = 1528100.0,
  is_cesion               = true,
  pcv_block               = 3,
  precalificacion_status  = 'DENEGADA',
  precalificacion_notes   = 'Cliente posee un RCI del 58% (credito prendario por Q113 mil y un extrafinanciamiento por Q4mil) se recomienda adicionar otro deudor.',
  razon_compra            = 'VIVIENDA',
  tipo_cliente            = 'CLIENTE NORMAL'
WHERE id = (
  SELECT ru.id FROM rv_units ru
  JOIN floors f ON f.id = ru.floor_id
  JOIN towers t ON t.id = f.tower_id
  WHERE t.project_id = '019c7d10-8e01-720f-942f-cac0017d83a8'
  AND ru.unit_number = '718'
);

COMMIT;