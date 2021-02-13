# Vaccine Alert Bot

Telegram bot checking for vaccine appointments.

## Setup

From the container registry:

- `docker run --name vac-bot -e TELEGRAM_TOKEN=... --restart unless-stopped -d ghcr.io/picode7/vac-alert-bot`

or local:

- Create `.env` file and add the `TELEGRAM_TOKEN = ...`.
- Run `docker-compose up -d`
