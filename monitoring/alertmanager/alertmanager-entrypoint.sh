#!/bin/sh
set -e

sed -e "s|SMTP_HOST_PLACEHOLDER|${SMTP_HOST:-smtp.gmail.com}|g" \
    -e "s|SMTP_PORT_PLACEHOLDER|${SMTP_PORT:-587}|g" \
    -e "s|SMTP_USERNAME_PLACEHOLDER|${SMTP_USERNAME}|g" \
    -e "s|SMTP_PASSWORD_PLACEHOLDER|${SMTP_PASSWORD}|g" \
    -e "s|ALERT_EMAIL_FROM_PLACEHOLDER|${ALERT_EMAIL_FROM}|g" \
    -e "s|ALERT_EMAIL_TO_PLACEHOLDER|${ALERT_EMAIL_TO}|g" \
    /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml

exec /bin/alertmanager "$@"