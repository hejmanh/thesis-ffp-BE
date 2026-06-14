# Local CA certificates

Place local root CA certificates here when Docker needs to trust a proxy, VPN, antivirus, or organization certificate.

Then set this in `.env`:

```env
NODE_EXTRA_CA_CERTS=/app/certs/[filename].crt
```

Do not commit real certificate files from this folder.
