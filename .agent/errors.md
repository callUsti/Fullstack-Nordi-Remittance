 make kafka-setup
2026-10-12T22:27:18.349708300Z main ERROR Reconfiguration failed: No configuration found for '2c7b84de' at 'null' in 'null'
"\033[36mClearing any stale KRaft storage...\033[0m"
"\033[36mGenerating cluster UUID and formatting KRaft storage...\033[0m"
kafka-storage.bat format -t Q2mLLDAiTd2Q_53MrKP1AQ --standalone -c C:\kafka\config\server.properties
2026-10-12T22:27:26.286122600Z main ERROR Reconfiguration failed: No configuration found for '2c7b84de' at 'null' in 'null'
Bootstrap metadata: BootstrapMetadata(records=[ApiMessageAndVersion(FeatureLevelRecord(name='metadata.version', featureLevel=30) at version 0), ApiMessageAndVersion(FeatureLevelRecord(name='eligible.leader.replicas.version', featureLevel=1) at version 0), ApiMessageAndVersion(FeatureLevelRecord(name='group.version', featureLevel=1) at version 0), ApiMessageAndVersion(FeatureLevelRecord(name='share.version', featureLevel=1) at version 0), ApiMessageAndVersion(FeatureLevelRecord(name='streams.version', featureLevel=1) at version 0), ApiMessageAndVersion(FeatureLevelRecord(name='transaction.version', featureLevel=2) at version 0)], metadataVersionLevel=30, source=format command)
Formatting dynamic metadata voter directory C:/kafka/kraft-combined-logs with metadata.version 4.3-IV0.
"\033[32mΓ£ô KRaft storage formatted with cluster ID: Q2mLLDAiTd2Q_53MrKP1AQ\033[0m"
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:36 char:51
+     Write-Host "  waiting for Kafka... (${elapsed}s)" -ForegroundColo ...
+                                                   ~
Unexpected token 's' in expression or statement.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:36 char:51
+     Write-Host "  waiting for Kafka... (${elapsed}s)" -ForegroundColo ...
+                                                   ~
Missing closing ')' in expression.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:32 char:26
+     if (Is-KafkaRunning) {
+                          ~
Missing closing '}' in statement block or type definition.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:29 char:4
+ do {
+    ~
Missing closing '}' in statement block or type definition.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:36 char:52
+     Write-Host "  waiting for Kafka... (${elapsed}s)" -ForegroundColo ...
+                                                    ~
Missing while or until keyword in do loop.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:36 char:52
+     Write-Host "  waiting for Kafka... (${elapsed}s)" -ForegroundColo ...
+                                                    ~
Unexpected token ')' in expression or statement.
At C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Backend-Nordi-remittance\scripts\kafka-start.ps1:39 char:13
+ Write-Host "âœ— Kafka failed to start after ${MaxWaitSecs}s â€” check ...
+             ~~~
Unexpected token 'âœ—' in expression or statement.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : UnexpectedToken

make: *** [Makefile:284: kafka-start] Error 1