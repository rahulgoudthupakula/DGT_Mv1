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

It asks for the existing RDS `postgres` password and then the existing `dgt_app` password without displaying either. It saves a restricted backup before running Flyway V2, grants non-owner runtime permissions, verifies the application login, writes a root-controlled application credential file, and starts the service. Flyway runs separately using administrative credentials; the application has Flyway disabled and no DELETE permissions on business tables or TRUNCATE/DDL permissions. The runtime permission script allows DELETE only on `refresh_tokens` so session renewal can consume used tokens and logout can revoke them. Do not use `baseline` or `repair` to bypass migration errors.

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


## Employee documents and emergency contacts

The employee form reuses `employee_documents` and `employee_emergency_contacts`. These records are shared across the employee's assigned stores and can be accessed only by a company administrator through an authorized store employee endpoint. List responses exclude contacts, document metadata and file contents. Downloads require authentication and are attachments with `Cache-Control: no-store`; no public file URL is returned.

Before deploying this feature to an existing EC2 installation, merge `app.employee-documents.directory: /var/lib/dgt/employee-documents` into `/etc/dgt/application-production.yml`. Add `StateDirectory=dgt` and `StateDirectoryMode=0700` under `[Service]` in the existing systemd unit (or a reviewed drop-in), then run `sudo systemctl daemon-reload`. The updated unit template includes both settings. Keep `ProtectSystem=strict` and `ProtectHome=true`; systemd grants the service access to its state directory. Set the active Nginx `client_max_body_size` to `27m`, validate with `sudo nginx -t`, and reload Nginx. The CI routine artifact update does not install these configuration changes automatically.

Uploads allow PDF, JPG/JPEG and PNG, five files per save, 5 MiB each. Spring limits the multipart request to 26 MiB. Original filenames are metadata only; disk paths use generated identifiers, directories use mode 0700 and files use 0600. An upload failure rolls back the employee transaction and removes files written by that transaction. Emergency contacts support adding and updating; this feature does not grant DELETE access to contacts or documents.

Files live outside application release folders and PostgreSQL; database rows retain only metadata and an internal storage key. Back up `/var/lib/dgt/employee-documents` along with RDS, and restore both when recovering. A process crash between file creation and transaction completion can leave an unreferenced file; do not remove files without checking the stored keys. This initial implementation uses the EC2 instance's persistent volume; multiple backend instances would require shared private storage. Development uses the git-ignored `Backend/.employee-documents` directory when launched from Backend with the dev profile.
