# Settings, Users, and Admin Gaps

| Web Feature | Web API | Mobile Status | Mobile Route | Notes |
|-------------|---------|---------------|--------------|-------|
| Update profile | auth | Complete | `Settings` | |
| Change password | auth | Complete | `Settings` | |
| Branch switch | branches | Complete | `Settings` / `BranchSwitcher` | |
| Users list | settings `/mcp/users` | Complete | `Users` | |
| Create / edit user | settings API | Complete | `UserForm` | Roles sync |
| Roles UI | `/mcp/roles` | Partial | `Roles` | Read-only definitions |
| Branches list/detail | `branchesManageAPI` | Complete | `BranchesList`, `BranchDetail` | POS/tax settings |
| Tenant settings | `tenantAPI` | Partial | `TenantSettings` | Read-only shell |
| Activity logs | `activityLogsAPI` | Complete | `ActivityLogs`, `ActivityLogDetail` | No clear on mobile |
| Backup | `backupAPI` | Disabled | `BackupInfo` | Web-only reason |
| Notifications | notifications | Complete | `Notifications` | |
| Printer profiles | mobile | Complete | `PrinterProfiles` | Mobile-native |
