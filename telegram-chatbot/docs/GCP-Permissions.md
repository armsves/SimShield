# Google Cloud Permissions & Setup for SimShield

To enable the backend to interact with Firestore and other Google Cloud services, follow these setup and permission guidelines.

## 1. Local Authentication (ADC)
The project uses **Application Default Credentials (ADC)** to authenticate your local development environment without the need for static JSON keys.

### Login via GCloud CLI:
```bash
gcloud auth application-default login
```
This stores a credential file that the Google Cloud SDKs automatically detect.

---

## 2. Required IAM Roles
The account you use to login (or the service account used in Cloud Run) must have the following roles:

| Role Name | ID | Purpose |
| :--- | :--- | :--- |
| **Cloud Datastore User** | `roles/datastore.user` | Full access to Firestore (read/write/delete). |
| **Service Usage Consumer** | `roles/serviceusage.serviceUsageConsumer` | Required to make API calls against the project. |

### Assigning Roles (CLI Example):
```bash
gcloud projects add-iam-policy-binding [PROJECT_ID] 
    --member="user:[YOUR_EMAIL]" 
    --role="roles/datastore.user"
```

---

## 3. Environment Variables
Ensure these are set in your `.env` file for local development:

- `GOOGLE_CLOUD_PROJECT_ID`: The unique ID of your GCP project.

---

## 4. Firestore Configuration
- **Mode**: Native Mode (Standard for most applications).
- **Location**: Choose a region close to your users (e.g., `us-central1`).
