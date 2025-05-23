## LOCAL DEVELOPMENT

* The application is fully dockerized. If you have docker installed on your system simply run

```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

* To stop the docker containers use 

```bash
docker-compose -f docker-compose.dev.yml down
```

## PROD DEPLOY  