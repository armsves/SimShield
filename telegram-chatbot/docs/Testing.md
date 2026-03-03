# SimShield Testing Documentation

## Test Structure
The project uses a split testing strategy to balance speed and reliability:

- `tests/unit/`: **Unit Tests**. Isolated tests using mocks. No external dependencies or credentials required.
- `tests/e2e/`: **End-to-End Tests**. Integration tests that interact with live Google Cloud services (Firestore).

## Running Tests

### Unit Tests
Run all unit tests using `pytest`:
```bash
pytest tests/unit/
```

### E2E Tests
Run E2E tests manually. These require active Google Cloud credentials and a valid project ID.
```bash
python tests/e2e/test_firestore_e2e.py
```

## Requirements for E2E
To run E2E tests locally, ensure:
1.  **ADC is configured**: `gcloud auth application-default login`
2.  **Project ID is set**: `GOOGLE_CLOUD_PROJECT_ID` must be present in your `.env` file.
3.  **Permissions**: Your authenticated account must have `Cloud Datastore User` permissions on the project.
