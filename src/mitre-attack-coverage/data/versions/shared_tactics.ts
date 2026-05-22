/**
 * Shared tactic definitions for v17 and v18.1.
 * v19 overrides Defense Evasion with two new tactics — see v19.ts.
 */
import type { MitreVersionTacticConfig } from './types';

export const SHARED_TACTICS_V17_V18: MitreVersionTacticConfig[] = [
  {
    id: 'TA0043', name: 'Reconnaissance', shortName: 'reconnaissance',
    techniques: ['T1595','T1592','T1589','T1590','T1591','T1598','T1597','T1596','T1593','T1594'],
  },
  {
    id: 'TA0042', name: 'Resource Development', shortName: 'resource-development',
    techniques: ['T1583','T1586','T1584','T1587','T1585','T1588','T1608'],
  },
  {
    id: 'TA0001', name: 'Initial Access', shortName: 'initial-access',
    techniques: ['T1189','T1190','T1133','T1200','T1566','T1091','T1195','T1199','T1078'],
  },
  {
    id: 'TA0002', name: 'Execution', shortName: 'execution',
    techniques: ['T1059','T1609','T1610','T1203','T1559','T1106','T1053','T1648','T1129','T1072','T1569','T1204','T1047'],
  },
  {
    id: 'TA0003', name: 'Persistence', shortName: 'persistence',
    techniques: ['T1098','T1197','T1547','T1037','T1176','T1554','T1543','T1546','T1574','T1525','T1556','T1137','T1542','T1505','T1205','T1078'],
  },
  {
    id: 'TA0004', name: 'Privilege Escalation', shortName: 'privilege-escalation',
    techniques: ['T1548','T1134','T1547','T1037','T1543','T1484','T1611','T1546','T1068','T1574','T1055','T1053','T1078'],
  },
  {
    id: 'TA0005', name: 'Defense Evasion', shortName: 'defense-evasion',
    techniques: [
      'T1548','T1134','T1197','T1622','T1140','T1610','T1006','T1484',
      'T1480','T1211','T1222','T1564','T1574','T1562','T1070','T1202',
      'T1036','T1112','T1601','T1599','T1027','T1647','T1542','T1055',
      'T1207','T1014','T1218','T1216','T1221','T1205','T1127','T1535',
      'T1550','T1078','T1497','T1600','T1220',
    ],
  },
  {
    id: 'TA0006', name: 'Credential Access', shortName: 'credential-access',
    techniques: ['T1557','T1110','T1555','T1212','T1187','T1606','T1056','T1556','T1111','T1621','T1040','T1003','T1528','T1558','T1539','T1552'],
  },
  {
    id: 'TA0007', name: 'Discovery', shortName: 'discovery',
    techniques: ['T1087','T1010','T1217','T1580','T1538','T1526','T1619','T1613','T1622','T1083','T1615','T1654','T1046','T1135','T1040','T1201','T1120','T1069','T1057','T1012','T1018','T1518','T1082','T1614','T1016','T1049','T1033','T1007','T1124','T1497'],
  },
  {
    id: 'TA0008', name: 'Lateral Movement', shortName: 'lateral-movement',
    techniques: ['T1210','T1534','T1570','T1563','T1021','T1091','T1072','T1080','T1550'],
  },
  {
    id: 'TA0009', name: 'Collection', shortName: 'collection',
    techniques: ['T1557','T1560','T1123','T1119','T1185','T1115','T1530','T1602','T1213','T1005','T1039','T1025','T1114','T1056','T1113','T1125','T1074'],
  },
  {
    id: 'TA0011', name: 'Command and Control', shortName: 'command-and-control',
    techniques: ['T1071','T1092','T1132','T1001','T1568','T1573','T1008','T1665','T1104','T1095','T1571','T1572','T1090','T1219','T1205','T1102'],
  },
  {
    id: 'TA0010', name: 'Exfiltration', shortName: 'exfiltration',
    techniques: ['T1020','T1030','T1048','T1041','T1011','T1052','T1567','T1029','T1537'],
  },
  {
    id: 'TA0040', name: 'Impact', shortName: 'impact',
    techniques: ['T1531','T1485','T1486','T1565','T1491','T1561','T1499','T1495','T1490','T1498','T1496','T1489','T1529'],
  },
];
