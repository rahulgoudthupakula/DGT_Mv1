# AWS deployment

Target: Amazon Linux 2023 EC2, private PostgreSQL 17 RDS, https://dgtinnovations.com.

## Release

Build the backend with Java 21 (`mvn -f Backend/pom.xml test package`). Build the frontend with `VITE_API_BASE_URL=/api/v1 VITE_DATA_ENV=production VITE_PROFILE_PREVIEW=true npm run build` in Frontend. Production runs the compiled artifacts from the matching Git commit. Local `.env` files and database dumps are excluded from Git.

The prepared EC2 release is `~/dgt-release`. `/opt/dgt/current` contains its backend.jar and frontend directory. The runtime service binds to localhost only; nginx serves HTTPS and proxies `/api/` to it.

Before activation, Namecheap DNS must point `@` A to the EC2 public IP and `www` CNAME to `dgtinnovations.com`. EC2 security group must permit 80/443 from the internet and SSH only from the administrator IP. RDS remains private. The current automatically assigned IP can change after stop/start; associate an Elastic IP and update DNS before relying on a permanent address.

Run in the EC2 SSH terminal:

```bash
bash ~/dgt-release/activate.sh dgtinnovations.com
```

It asks for the existing RDS `postgres` password and then the existing `dgt_app` password without displaying either. It saves a restricted backup before running Flyway V2, grants non-owner runtime permissions, verifies the application login, writes a root-controlled application credential file, and starts the service. Flyway runs separately using administrative credentials; the application has Flyway disabled and no DELETE/TRUNCATE/DDL permissions. Do not use `baseline` or `repair` to bypass migration errors.

Finally it issues an HTTPS certificate and configures renewal. If DNS is not ready, rerun only:

```bash
bash ~/dgt-release/enable-https.sh
```

No application traffic is served over plain HTTP. Certificate issuance covers both apex and www; both DNS records must resolve correctly.

## Verification and operations

```bash
sudo systemctl status dgt-backend nginx --no-pager
curl --fail https://dgtinnovations.com/api/v1/health
sudo journalctl -u dgt-backend -n 50 --no-pager
```

Health verifies the process. Complete a real sign-in and view a store report to verify application access. Users are the accounts restored from the original database; deployment creates no new website password.

The database owner can still change or delete records. Application UPDATE permissions can overwrite values; archival is not immutable revision history. Preserve RDS backups and restrict owner credentials. Rerun reviewed runtime-permissions.sql after future migrations add tables.

For application rollback, restore the previous release artifacts and restart the service. Do not roll back the database destructively; archived rows need the corresponding current-row-aware backend. The first release has no prior AWS application to roll back to.
