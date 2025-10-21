# SSL Certificate Configuration for Production Environment

This guide provides step-by-step instructions for configuring SSL certificates using Let's Encrypt in a production environment with Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Domain name pointing to your server (your-domain-name.com)
- Server accessible on ports 80 and 443
- Valid email address for Let's Encrypt notifications

## Directory Structure

```
campus-connect/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
└── certbot/
    ├── conf/
    └── www/
```

## Step-by-Step Configuration

### 1. Initial Setup

Create the necessary directory structure for SSL certificates:

```sh
mkdir -p ./certbot/conf/live/your-domain-name.com
mkdir -p ./certbot/www
```

### 2. Generate Temporary Certificate

Before obtaining a real certificate, create a temporary self-signed certificate to avoid nginx startup issues:

```sh
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
  -keyout "./certbot/conf/live/your-domain-name.com/privkey.pem" \
  -out "./certbot/conf/live/your-domain-name.com/fullchain.pem" \
  -subj "/CN=localhost"
```

### 3. Start Services

Start your Docker services to ensure nginx is running:

```sh
docker compose up -d
```

### 4. Test with Staging Environment

First, test with Let's Encrypt staging environment to avoid rate limits:

```sh
docker compose run --rm --entrypoint "certbot" certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email codingclub@nitap.ac.in \
  --agree-tos \
  --no-eff-email \
  -d your-domain-name.com \
  -d www.your-domain-name.com \
  --staging
```

### 5. Obtain Production Certificate

Once staging works, get the production certificate:

```sh
docker compose run --rm --entrypoint "certbot" certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email codingclub@nitap.ac.in \
  --agree-tos \
  --no-eff-email \
  -d your-domain-name.com \
  -d www.your-domain-name.com
```

### 6. Reload Nginx

After obtaining the certificate, reload nginx to use the new certificate:

```sh
docker compose exec nginx nginx -s reload
```

## Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up automatic renewal:

### Manual Renewal

```sh
docker compose run --rm --entrypoint "certbot" certbot renew
docker compose exec nginx nginx -s reload
```

### Automatic Renewal with Cron

Add this cron job to run renewal twice daily:

```sh
# Edit crontab
crontab -e

# Add this line
0 12,00 * * * cd campus-connect && docker compose run --rm --entrypoint "certbot" certbot renew --quiet && docker compose exec nginx nginx -s reload
```

## Nginx Configuration Example

Ensure your nginx configuration includes SSL settings:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain-name.com www.your-domain-name.com;

    ssl_certificate /etc/nginx/ssl/live/your-domain-name.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/your-domain-name.com/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        # Your application configuration
    }
}

server {
    listen 80;
    server_name your-domain-name.com www.your-domain-name.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

## Docker Compose Configuration

Ensure your `docker-compose.yml` includes certbot service:

```yaml
services:
  nginx:
    # ... other config
    volumes:
      - ./certbot/conf:/etc/nginx/ssl
      - ./certbot/www:/var/www/certbot
    ports:
      - "80:80"
      - "443:443"

  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: echo "Certbot service ready"
```

## Troubleshooting

### Common Issues

1. **Certificate not found**: Ensure the certificate path in nginx matches the certbot output location
2. **Rate limit exceeded**: Use staging environment for testing, production has strict rate limits
3. **Domain verification failed**: Ensure domain points to your server and port 80 is accessible
4. **Permission errors**: Check file permissions on certificate directories

### Verify Certificate

Check certificate status:

```sh
# Check certificate expiration
docker compose run --rm --entrypoint "certbot" certbot certificates

# Test SSL configuration
openssl s_client -connect your-domain-name.com:443 -servername your-domain-name.com
```

### Logs

Check logs for debugging:

```sh
# Nginx logs
docker compose logs nginx

# Certbot logs
docker compose run --rm --entrypoint "certbot" certbot --help
```

## Security Best Practices

1. **Regular Updates**: Keep certbot and nginx images updated
2. **Monitor Expiration**: Set up alerts for certificate expiration
3. **Backup Certificates**: Regularly backup `/etc/letsencrypt` directory
4. **Security Headers**: Implement proper SSL security headers
5. **OCSP Stapling**: Enable OCSP stapling for better performance

## Support

- Let's Encrypt Documentation: https://letsencrypt.org/docs/
- Certbot Documentation: https://certbot.eff.org/docs/
- SSL Labs Test: https://www.ssllabs.com/ssltest/
