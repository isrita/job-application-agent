# Security

Do not disclose credentials, wallet material, private keys, or account records in issues or pull requests.
Use local ignored environment files and external private-key files. Rotate exposed credentials with their issuer.
Report reproducible problems to the repository owner without including secrets; use private vulnerability reporting if enabled.

The sports core is monitoring/paper-only. Human evidence approval is not execution authorization.
CI and offline commands do not need credentials. The reference application's live CLI is separate and must not be activated by automation.
Do not store credentials in Bronze payloads, checkpoints, prompts, browser responses, or archives.
