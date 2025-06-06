# Installing ICON Forecast Service

## Installation Steps

1. Copy the service files to systemd directory:
```bash
sudo cp /home/sellinios/development/projects/aethra/backend/deployments/systemd/icon-forecast.service /etc/systemd/system/
sudo cp /home/sellinios/development/projects/aethra/backend/deployments/systemd/icon-forecast.timer /etc/systemd/system/
```

2. Reload systemd to recognize new services:
```bash
sudo systemctl daemon-reload
```

3. Enable and start the timer (this will run the service on schedule):
```bash
sudo systemctl enable icon-forecast.timer
sudo systemctl start icon-forecast.timer
```

4. Check timer status:
```bash
sudo systemctl status icon-forecast.timer
sudo systemctl list-timers icon-forecast.timer
```

## Manual Operations

Run the service manually (one-time):
```bash
sudo systemctl start icon-forecast.service
```

Check service status:
```bash
sudo systemctl status icon-forecast.service
```

View logs:
```bash
# Recent logs
sudo journalctl -u icon-forecast.service -n 100

# Follow logs in real-time
sudo journalctl -u icon-forecast.service -f

# Logs from today
sudo journalctl -u icon-forecast.service --since today
```

Stop the timer (if needed):
```bash
sudo systemctl stop icon-forecast.timer
sudo systemctl disable icon-forecast.timer
```

## Notes

- The service runs 8 times per day at specific times when ICON-EU data is available
- Logs are also saved to `/home/sellinios/development/projects/aethra/backend/logs/icon_cron.log`
- The service will automatically restart on failure after 5 minutes
- Database password is set in the service environment variables