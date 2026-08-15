# CareerPilot Async Load Tests

These Locust scenarios measure task submission and completion behavior with the mock AI provider. They do not call OpenAI.

Start the local stack:

```bash
AI_PROVIDER=mock docker compose up --build
```

Install Locust:

```bash
python -m pip install -r load_tests/requirements.txt
```

Run a small submission test:

```bash
locust -f load_tests/locustfile.py --host http://localhost:8000 --users 100 --spawn-rate 20 --run-time 5m
```

Scale workers in another terminal:

```bash
docker compose up -d --scale worker=4
```

Suggested runs:

- 100 submissions, 1 worker
- 100 submissions, 2 workers
- 1,000 submissions, 4 workers

Record at least API submission latency, task polling completion latency, throughput, queue depth from Redis/Celery, and failure rate. Do not hard-code performance claims in project docs until you have measured them on the target machine.
