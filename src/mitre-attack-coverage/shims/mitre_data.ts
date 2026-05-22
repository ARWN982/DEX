/**
 * STUB: replaces the dynamic import of Kibana's static MITRE ATT&CK data bundle.
 * Contains a representative subset of real ATT&CK v14 data so the grid renders
 * with realistic tactics and techniques.
 * 
 * STUB — replace with the full @elastic/security-solution MITRE data or a fetch
 * from the real API when integrating.
 */
import type { MitreTactic, MitreTechnique, MitreSubTechnique } from './mitre_types';

export const tactics: MitreTactic[] = [
  { id: 'TA0001', name: 'Initial Access',          reference: 'https://attack.mitre.org/tactics/TA0001/' },
  { id: 'TA0002', name: 'Execution',               reference: 'https://attack.mitre.org/tactics/TA0002/' },
  { id: 'TA0003', name: 'Persistence',             reference: 'https://attack.mitre.org/tactics/TA0003/' },
  { id: 'TA0004', name: 'Privilege Escalation',    reference: 'https://attack.mitre.org/tactics/TA0004/' },
  { id: 'TA0005', name: 'Defense Evasion',         reference: 'https://attack.mitre.org/tactics/TA0005/' },
  { id: 'TA0006', name: 'Credential Access',       reference: 'https://attack.mitre.org/tactics/TA0006/' },
  { id: 'TA0007', name: 'Discovery',               reference: 'https://attack.mitre.org/tactics/TA0007/' },
  { id: 'TA0008', name: 'Lateral Movement',        reference: 'https://attack.mitre.org/tactics/TA0008/' },
  { id: 'TA0009', name: 'Collection',              reference: 'https://attack.mitre.org/tactics/TA0009/' },
  { id: 'TA0010', name: 'Exfiltration',            reference: 'https://attack.mitre.org/tactics/TA0010/' },
  { id: 'TA0011', name: 'Command and Control',     reference: 'https://attack.mitre.org/tactics/TA0011/' },
  { id: 'TA0040', name: 'Impact',                  reference: 'https://attack.mitre.org/tactics/TA0040/' },
];

export const subtechniques: MitreSubTechnique[] = [
  { id: 'T1078.001', techniqueId: 'T1078', name: 'Default Accounts',         reference: 'https://attack.mitre.org/techniques/T1078/001/', tactics: ['TA0001','TA0003','TA0004','TA0005'] },
  { id: 'T1078.002', techniqueId: 'T1078', name: 'Domain Accounts',          reference: 'https://attack.mitre.org/techniques/T1078/002/', tactics: ['TA0001','TA0003','TA0004','TA0005'] },
  { id: 'T1078.003', techniqueId: 'T1078', name: 'Local Accounts',           reference: 'https://attack.mitre.org/techniques/T1078/003/', tactics: ['TA0001','TA0003','TA0004','TA0005'] },
  { id: 'T1059.001', techniqueId: 'T1059', name: 'PowerShell',               reference: 'https://attack.mitre.org/techniques/T1059/001/', tactics: ['TA0002'] },
  { id: 'T1059.003', techniqueId: 'T1059', name: 'Windows Command Shell',    reference: 'https://attack.mitre.org/techniques/T1059/003/', tactics: ['TA0002'] },
  { id: 'T1059.006', techniqueId: 'T1059', name: 'Python',                   reference: 'https://attack.mitre.org/techniques/T1059/006/', tactics: ['TA0002'] },
  { id: 'T1110.001', techniqueId: 'T1110', name: 'Password Guessing',        reference: 'https://attack.mitre.org/techniques/T1110/001/', tactics: ['TA0006'] },
  { id: 'T1110.003', techniqueId: 'T1110', name: 'Password Spraying',        reference: 'https://attack.mitre.org/techniques/T1110/003/', tactics: ['TA0006'] },
  { id: 'T1110.004', techniqueId: 'T1110', name: 'Credential Stuffing',      reference: 'https://attack.mitre.org/techniques/T1110/004/', tactics: ['TA0006'] },
];

export const techniques: MitreTechnique[] = [
  { id: 'T1078', name: 'Valid Accounts',               reference: 'https://attack.mitre.org/techniques/T1078/', tactics: ['TA0001','TA0003','TA0004','TA0005'], subtechniques: subtechniques.filter(s => s.id.startsWith('T1078')) },
  { id: 'T1059', name: 'Command and Scripting Interpreter', reference: 'https://attack.mitre.org/techniques/T1059/', tactics: ['TA0002'], subtechniques: subtechniques.filter(s => s.id.startsWith('T1059')) },
  { id: 'T1110', name: 'Brute Force',                  reference: 'https://attack.mitre.org/techniques/T1110/', tactics: ['TA0006'], subtechniques: subtechniques.filter(s => s.id.startsWith('T1110')) },
  { id: 'T1566', name: 'Phishing',                     reference: 'https://attack.mitre.org/techniques/T1566/', tactics: ['TA0001'], subtechniques: [] },
  { id: 'T1190', name: 'Exploit Public-Facing Application', reference: 'https://attack.mitre.org/techniques/T1190/', tactics: ['TA0001'], subtechniques: [] },
  { id: 'T1053', name: 'Scheduled Task/Job',           reference: 'https://attack.mitre.org/techniques/T1053/', tactics: ['TA0002','TA0003','TA0004'], subtechniques: [] },
  { id: 'T1547', name: 'Boot or Logon Autostart Execution', reference: 'https://attack.mitre.org/techniques/T1547/', tactics: ['TA0003','TA0004'], subtechniques: [] },
  { id: 'T1548', name: 'Abuse Elevation Control Mechanism', reference: 'https://attack.mitre.org/techniques/T1548/', tactics: ['TA0004','TA0005'], subtechniques: [] },
  { id: 'T1112', name: 'Modify Registry',              reference: 'https://attack.mitre.org/techniques/T1112/', tactics: ['TA0005'], subtechniques: [] },
  { id: 'T1003', name: 'OS Credential Dumping',        reference: 'https://attack.mitre.org/techniques/T1003/', tactics: ['TA0006'], subtechniques: [] },
  { id: 'T1087', name: 'Account Discovery',            reference: 'https://attack.mitre.org/techniques/T1087/', tactics: ['TA0007'], subtechniques: [] },
  { id: 'T1021', name: 'Remote Services',              reference: 'https://attack.mitre.org/techniques/T1021/', tactics: ['TA0008'], subtechniques: [] },
  { id: 'T1005', name: 'Data from Local System',       reference: 'https://attack.mitre.org/techniques/T1005/', tactics: ['TA0009'], subtechniques: [] },
  { id: 'T1041', name: 'Exfiltration Over C2 Channel', reference: 'https://attack.mitre.org/techniques/T1041/', tactics: ['TA0010'], subtechniques: [] },
  { id: 'T1071', name: 'Application Layer Protocol',  reference: 'https://attack.mitre.org/techniques/T1071/', tactics: ['TA0011'], subtechniques: [] },
  { id: 'T1486', name: 'Data Encrypted for Impact',   reference: 'https://attack.mitre.org/techniques/T1486/', tactics: ['TA0040'], subtechniques: [] },
];
