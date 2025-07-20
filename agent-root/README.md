
## ✅ Setup Instructions

### 1. Create a Virtual Environment

```bash
python -m venv venv

source venv/Scripts/activate
```

### Install Dependency

```pip install -r requirements.txt```

### Firebase admin sdky key should be saved like this
```firebase-adminsdk-key.json```

### Start the agent
```python -m nagar_chakshu```

### Endpoint

```POST http://127.0.0.1:8003/run```

Content-Type: application/json

{
  "message": "Fuse data",
  "context": {
    "user_id": "test-user-123"
  },
  "session_id": "test-session-abc"
}








