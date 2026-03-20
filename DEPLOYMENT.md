# 4uPDF Production Deployment Guide

This guide covers the complete production deployment of 4uPDF.com with Next.js frontend and FastAPI backend.

## Prerequisites

- Ubuntu 20.04+ server
- Domain name (4updf.com) pointed to server IP
- Root or sudo access
- Minimum 2GB RAM, 2 CPU cores

## 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx nodejs npm git

# Install Node.js 18+ (if not available)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Create application directory
sudo mkdir -p /var/www/4updf
sudo chown -R $USER:$USER /var/www/4updf

# Create log directory
sudo mkdir -p /var/log/4updf
sudo chown -R www-data:www-data /var/log/4updf
```

## 2. Backend Setup (FastAPI)

```bash
cd /var/www/4updf

# Clone or copy your project files
git clone <your-repo> .
# OR
# scp -r D:/Projects/PDF-split/* user@server:/var/www/4updf/

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
JWT_SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://4updf.com,https://www.4updf.com
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
EOF

# Create necessary directories
mkdir -p data uploads output
chmod 750 data uploads output

# Initialize database
python3 -c "from api import init_database; init_database()"
```

## 3. Frontend Setup (Next.js)

```bash
cd /var/www/4updf/web

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://4updf.com/api
NEXT_PUBLIC_BASE_URL=https://4updf.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
EOF

# Build for production
npm run build

# Verify build
ls -la .next/
```

## 4. SSL Certificate Setup

```bash
# Stop nginx if running
sudo systemctl stop nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d 4updf.com -d www.4updf.com --email your@email.com --agree-tos

# Verify certificate
sudo ls -la /etc/letsencrypt/live/4updf.com/

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 5. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp /var/www/4updf/nginx.conf /etc/nginx/sites-available/4updf

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/4updf /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## 6. Systemd Services Setup

```bash
# Copy service files
sudo cp /var/www/4updf/systemd/4updf-backend.service /etc/systemd/system/
sudo cp /var/www/4updf/systemd/4updf-frontend.service /etc/systemd/system/

# Edit service files to set correct paths and secrets
sudo nano /etc/systemd/system/4updf-backend.service
# Update JWT_SECRET_KEY, STRIPE_SECRET_KEY

sudo nano /etc/systemd/system/4updf-frontend.service
# Update NEXT_PUBLIC_GA_ID

# Set correct permissions
sudo chown -R www-data:www-data /var/www/4updf

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable 4updf-backend
sudo systemctl enable 4updf-frontend

# Start services
sudo systemctl start 4updf-backend
sudo systemctl start 4updf-frontend

# Check status
sudo systemctl status 4updf-backend
sudo systemctl status 4updf-frontend
```

## 7. Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/api/health

# Check frontend
curl http://localhost:3098

# Check nginx
curl https://4updf.com

# View logs
sudo journalctl -u 4updf-backend -f
sudo journalctl -u 4updf-frontend -f
tail -f /var/log/nginx/4updf_access.log
tail -f /var/log/nginx/4updf_error.log
```

## 8. Monitoring & Maintenance

### Log Rotation

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/4updf << EOF
/var/log/4updf/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload 4updf-backend
        systemctl reload 4updf-frontend
    endscript
}
EOF
```

### Automated Cleanup

```bash
# Create cleanup script
cat > /var/www/4updf/cleanup.sh << 'EOF'
#!/bin/bash
# Clean uploaded files older than 2 hours
find /var/www/4updf/uploads -type f -mmin +120 -delete
find /var/www/4updf/output -type f -mmin +120 -delete
EOF

chmod +x /var/www/4updf/cleanup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/30 * * * * /var/www/4updf/cleanup.sh") | crontab -
```

### Database Backup

```bash
# Create backup script
cat > /var/www/4updf/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/backups/4updf
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/4updf/data/4updf.db $BACKUP_DIR/4updf_$DATE.db
# Keep only last 30 days
find $BACKUP_DIR -name "4updf_*.db" -mtime +30 -delete
EOF

chmod +x /var/www/4updf/backup.sh

# Run daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/4updf/backup.sh") | crontab -
```

## 9. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify
sudo ufw status
```

## 10. Performance Tuning

### Nginx

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 2048;

http {
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 500M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # Timeouts
    client_body_timeout 300s;
    client_header_timeout 300s;
    keepalive_timeout 65;
    send_timeout 300s;

    # Connection pooling
    keepalive_requests 100;
}
```

### Python Backend

Increase uvicorn workers in `4updf-backend.service`:

```
ExecStart=/var/www/4updf/venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000 --workers 4 --loop uvloop
```

## 11. Troubleshooting

### Backend not starting

```bash
sudo journalctl -u 4updf-backend -n 50
# Check for missing dependencies
source /var/www/4updf/venv/bin/activate
python3 -c "import api"
```

### Frontend not starting

```bash
sudo journalctl -u 4updf-frontend -n 50
# Rebuild if needed
cd /var/www/4updf/web
npm run build
```

### SSL issues

```bash
# Test SSL
sudo certbot renew --dry-run

# Check certificate
sudo certbot certificates
```

### High memory usage

```bash
# Check processes
htop

# Reduce workers if needed
sudo systemctl edit 4updf-backend
# Change --workers to 2
```

## 12. Updates & Deployment

```bash
# Pull latest changes
cd /var/www/4updf
git pull

# Update backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart 4updf-backend

# Update frontend
cd web
npm install
npm run build
sudo systemctl restart 4updf-frontend

# Clear nginx cache
sudo systemctl reload nginx
```

## Security Checklist

- [x] HTTPS enforced
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] File upload validation
- [x] JWT secret properly set
- [x] CORS properly configured
- [x] Firewall enabled
- [x] Regular backups
- [x] Log rotation
- [x] Temporary file cleanup
- [x] Database permissions restricted
- [x] Services run as www-data
- [x] No directory listing

## Monitoring URLs

- Health check: https://4updf.com/api/health
- Frontend: https://4updf.com
- Sitemap: https://4updf.com/sitemap.xml
- Robots: https://4updf.com/robots.txt

## Support

For issues, check logs:
- Backend: `/var/log/4updf/backend.log`
- Frontend: `/var/log/4updf/frontend.log`
- Nginx: `/var/log/nginx/4updf_error.log`
