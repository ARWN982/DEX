export interface AutoDexLogFullReasoning {
  summary: string;
  diagnosis: string[];
  decision: string[];
  confidence: number;
  riskLevel: string;
  changesMade: string[];
  relatedMitreIds: string[];
}

export interface AutoDexMockLog {
  id: string;
  timestamp: string;
  action: string;
  actionColor: 'danger' | 'warning' | 'primary';
  rule: string;
  reasoning: string;
  fullReasoning?: AutoDexLogFullReasoning;
  status: 'success';
  needsApproval: boolean;
}

export const MOCK_AUTODEX_LOGS: AutoDexMockLog[] = [
  {
    id: '1',
    timestamp: 'Apr 15, 2026 @ 14:22:07',
    action: 'Execution failure',
    actionColor: 'danger',
    rule: 'Unusual Network Destination Domain Name',
    reasoning:
      'Rule was timing out due to a missing index alias. AutoDEX updated the index pattern from logs-endpoint.* to logs-endpoint.events.* to match the installed data stream.',
    fullReasoning: {
      summary:
        'AutoDEX diagnosed and remediated a persistent execution failure caused by an index alias mismatch introduced after a recent Elastic Agent policy update.',
      diagnosis: [
        'The rule "Unusual Network Destination Domain Name" had been failing silently for 6 hours. No alerts were being generated despite active network telemetry flowing into the cluster.',
        "AutoDEX first checked the rule's execution log and found repeated \"index_not_found_exception\" errors referencing logs-endpoint.*. Cross-referencing the installed Elastic Agent integrations, AutoDEX confirmed that the Endpoint integration (v8.13) now writes to the namespaced index logs-endpoint.events.* rather than the wildcard catch-all.",
        "The root cause was a data stream namespace change introduced in Elastic Agent 8.12.1. The rule's index pattern had not been updated to reflect this change, causing every execution to produce zero results and trigger a failure status.",
      ],
      decision: [
        'AutoDEX evaluated three possible remediation paths: (1) update the rule\'s index pattern, (2) create a legacy alias to bridge the old index name, or (3) flag the rule for manual review.',
        'Path 1 was selected because the change is deterministic — the new data stream name is directly observable from the installed integrations manifest. The risk of a false-positive index pattern is effectively zero when the destination index already exists with active write throughput.',
        'The index pattern was updated from logs-endpoint.* to logs-endpoint.events.* and the rule was re-enabled. AutoDEX verified the next scheduled execution returned results before marking the action complete.',
      ],
      confidence: 98,
      riskLevel: 'Low',
      changesMade: ['Updated index_patterns: ["logs-endpoint.events.*", "logs-endpoint.*", "endgame-*"]'],
      relatedMitreIds: ['T1071.001 — Application Layer Protocol: Web Protocols'],
    },
    status: 'success',
    needsApproval: true,
  },
  {
    id: '2',
    timestamp: 'Apr 15, 2026 @ 14:18:43',
    action: 'Tuned false positives',
    actionColor: 'warning',
    rule: 'Potential PowerShell HackTool Script by Author',
    reasoning:
      'Rule generated 340 alerts/week with 98% originating from the backup-agent process. AutoDEX added an exception for process.name: "backup-agent.exe" on host groups matching "backup-*".',
    fullReasoning: {
      summary:
        'AutoDEX identified a high-volume false positive pattern in the PowerShell HackTool rule driven entirely by a legitimate backup automation process and added a scoped exception.',
      diagnosis: [
        'Over the prior 7 days, the rule triggered 340 alerts. AutoDEX aggregated the alert data and found that 98.2% of alerts (334/340) shared the same process ancestry: backup-agent.exe → powershell.exe. The parent binary was signed by an internal certificate authority and its hash was stable across all 72 affected hosts.',
        'The remaining 6 alerts (1.8%) originated from distinct user sessions on endpoints not in the backup fleet, with novel command-line arguments consistent with known red-team tooling. These were preserved as valid detections.',
        'AutoDEX cross-referenced the backup-agent.exe binary against the internal asset inventory via the fleet API and confirmed it is a managed, approved process deployed by the IT Operations team on all hosts matching the "backup-*" naming convention.',
      ],
      decision: [
        'Rather than adding a broad process.name exception (which would suppress all PowerShell activity from backup-agent.exe globally), AutoDEX scoped the exception to host.name: backup-* to ensure coverage is maintained on any non-backup host where backup-agent.exe would be anomalous.',
        'The exception was written as: process.name: "backup-agent.exe" AND host.name: backup-*. This preserves detection on the 1.8% of alerts that do not match this pattern.',
        'AutoDEX calculated the expected alert volume reduction as ~334 alerts/week, reducing SOC analyst triage time for this rule by an estimated 11 hours per week.',
      ],
      confidence: 96,
      riskLevel: 'Low',
      changesMade: ['Added exception: process.name = "backup-agent.exe" AND host.name = "backup-*"'],
      relatedMitreIds: ['T1059.001 — Command and Scripting Interpreter: PowerShell'],
    },
    status: 'success',
    needsApproval: false,
  },
  {
    id: '3',
    timestamp: 'Apr 15, 2026 @ 13:55:11',
    action: 'Tuned false positives',
    actionColor: 'warning',
    rule: 'Unusual Execution via Microsoft Common Console File',
    reasoning:
      '210 alerts/week — 94% from developer workstations. Added exception for user.name matching internal dev group "corp-dev-*". This pattern was verified against 30 days of historical data.',
    fullReasoning: {
      summary:
        'AutoDEX surfaced a persistent false positive pattern on developer workstations driven by legitimate IDE and build tooling, and proposed a scoped exception pending analyst approval.',
      diagnosis: [
        'The rule "Unusual Execution via Microsoft Common Console File" generated 210 alerts over 7 days. AutoDEX clustered the alert data and found 94% (197 alerts) shared the process lineage: devenv.exe or msbuild.exe → mmc.exe → cmd.exe. All affected machines were developer workstations in the corp-dev-* Active Directory OU.',
        "The behaviour is explained by Visual Studio's use of MMC snap-ins during project build and deployment pipelines. This is a documented false positive class for this rule type and is consistent with patterns observed across multiple Elastic Security customer telemetry cohorts.",
        'The 6% of remaining alerts (13) showed mmc.exe spawned by unexpected parent processes including a cloud sync daemon and a browser process — these were flagged as higher-interest detections.',
      ],
      decision: [
        'This action requires approval because the automation level for false positive tuning is set to Semi-auto. AutoDEX has proposed the exception but will not apply it without analyst sign-off.',
        'Proposed exception scope: user.name: corp-dev-* — this targets the Active Directory group containing all developer workstations, ensuring the exception does not apply to production or server hosts where mmc.exe spawned by devenv.exe would be genuinely suspicious.',
        'If approved, the expected reduction is ~197 alerts/week. AutoDEX will continue monitoring the remaining 13 alerts and will escalate if the pattern changes.',
      ],
      confidence: 91,
      riskLevel: 'Medium — requires approval',
      changesMade: ['Proposed exception (pending approval): user.name = "corp-dev-*"'],
      relatedMitreIds: ['T1218.014 — System Binary Proxy Execution: MMC'],
    },
    status: 'success',
    needsApproval: true,
  },
  {
    id: '4',
    timestamp: 'Apr 15, 2026 @ 13:40:29',
    action: 'Installed rule',
    actionColor: 'primary',
    rule: 'AWS IAM Assume Role Policy Update',
    reasoning:
      'Your environment has AWS CloudTrail data in logs-aws.cloudtrail-*. This prebuilt rule covers T1078.004 (Cloud Accounts) which was identified as a coverage gap. AutoDEX installed and enabled it.',
    fullReasoning: {
      summary:
        'AutoDEX identified a MITRE ATT&CK coverage gap for T1078.004 (Cloud Accounts) and automatically installed the corresponding Elastic prebuilt rule after verifying data availability and absence of conflicts.',
      diagnosis: [
        'A periodic coverage audit found that T1078.004 (Valid Accounts: Cloud Accounts) had no active detection rules in the current ruleset. This technique is frequently used in AWS account takeover attacks and was flagged as a high-priority gap given your environment\'s active AWS footprint.',
        'AutoDEX confirmed that CloudTrail logs are actively flowing into logs-aws.cloudtrail-* with a write rate of ~12,000 events/hour. The prebuilt rule "AWS IAM Assume Role Policy Update" targets this index and requires no additional configuration.',
        'AutoDEX verified that no existing rules or suppression lists would conflict with the new rule, and that the rule\'s required fields (event.action, aws.cloudtrail.request_parameters) are present in the data.',
      ],
      decision: [
        'AutoDEX selected the Elastic prebuilt rule over writing a custom rule because the prebuilt version is maintained by Elastic Security Labs, receives automatic updates, and already includes tuned thresholds based on CloudTrail baseline behaviour.',
        'The rule was installed at severity "Medium" with the default schedule of every 5 minutes and a look-back of 9 minutes. AutoDEX enabled it immediately given the active data stream and absence of any known noise concerns.',
        'No approval was required as the automation level for rule installation is set to Full auto.',
      ],
      confidence: 99,
      riskLevel: 'Low',
      changesMade: ['Installed rule: AWS IAM Assume Role Policy Update (v1.0.2)', 'Status: Enabled', 'Severity: Medium'],
      relatedMitreIds: ['T1078.004 — Valid Accounts: Cloud Accounts'],
    },
    status: 'success',
    needsApproval: false,
  },
  {
    id: '5',
    timestamp: 'Apr 15, 2026 @ 13:38:02',
    action: 'Updated rule',
    actionColor: 'primary',
    rule: 'Potential Widespread Malware Infection Across Multiple Hosts',
    reasoning:
      'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update after verifying no active suppressions would be affected.',
    fullReasoning: {
      summary:
        'AutoDEX applied an Elastic Security Labs patch update to address a known false positive issue with legitimate antivirus processes, after verifying the change would not disrupt any active exceptions or suppressions.',
      diagnosis: [
        'Elastic Security Labs published rule version 3.3 for "Potential Widespread Malware Infection Across Multiple Hosts". The changelog described a fix for false positives triggered by Windows Defender\'s MsMpEng.exe and similar AV scanning processes that share network spread patterns with lateral movement malware.',
        'AutoDEX reviewed the diff between v3.2 and v3.3. The key change was an additional filter clause: NOT (process.name: ("MsMpEng.exe" OR "SentinelAgent.exe" OR "CylanceSvc.exe")). This narrows the detection to exclude known AV processes while preserving coverage for actual malware propagation.',
        'AutoDEX checked whether any existing exceptions or suppressions in your environment overlapped with the new built-in filter. No conflicts were found — the new exclusions are more specific than any custom suppression currently in place.',
      ],
      decision: [
        'The update was categorised as low-risk because it narrows detection scope (reducing false positives) rather than broadening it. A broadening change would require additional review.',
        'AutoDEX applied the update with no changes to the rule\'s schedule, severity, or index pattern. Version history was preserved in the audit log.',
        'This action required approval under the current Semi-auto configuration. AutoDEX has logged the update for analyst review but applied it immediately due to the low-risk, false-positive-reducing nature of the change.',
      ],
      confidence: 97,
      riskLevel: 'Low',
      changesMade: ['Updated rule version: 3.2 → 3.3', 'Added process exclusions for MsMpEng.exe, SentinelAgent.exe, CylanceSvc.exe'],
      relatedMitreIds: ['T1210 — Exploitation of Remote Services', 'T1570 — Lateral Tool Transfer'],
    },
    status: 'success',
    needsApproval: true,
  },
];
