#!/usr/bin/env bash
set -euo pipefail
release=$(cd -- "$(dirname -- "$0")" && pwd)
curl --fail --silent http://127.0.0.1:8080/api/v1/health
sudo install -d -m 755 /var/www/acme
sudo install -m 644 "$release/nginx-http.conf" /etc/nginx/conf.d/dgt.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
# Certificate issuance requires DNS for both names to point to this EC2 instance.
domains=(-d dgttechnologies.com)
if [[ "${1:-}" != "--apex-only" ]]; then domains+=(-d www.dgttechnologies.com); fi
sudo /opt/certbot/bin/certbot certonly --cert-name dgttechnologies.com --expand --webroot -w /var/www/acme "${domains[@]}" --agree-tos --register-unsafely-without-email --non-interactive
if [[ "${1:-}" == "--apex-only" ]]; then
 sed -e '/# BEGIN WWW REDIRECT/,/# END WWW REDIRECT/d' -e 's/server_name dgttechnologies.com www.dgttechnologies.com;/server_name dgttechnologies.com;/' "$release/nginx-https.conf" | sudo tee /etc/nginx/conf.d/dgt.conf >/dev/null
else
 sudo install -m 644 "$release/nginx-https.conf" /etc/nginx/conf.d/dgt.conf
fi
sudo nginx -t
sudo systemctl reload nginx
sudo install -m 644 "$release/dgt-certificate-renew.service" /etc/systemd/system/dgt-certificate-renew.service
sudo install -m 644 "$release/dgt-certificate-renew.timer" /etc/systemd/system/dgt-certificate-renew.timer
sudo systemctl daemon-reload
sudo systemctl enable --now dgt-certificate-renew.timer
curl --fail --silent https://dgttechnologies.com/api/v1/health
printf '\nWebsite: https://dgttechnologies.com\n'
