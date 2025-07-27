# Google Compute Engine Deployment Guide

## CORS Configuration for Agent-Root Server

The agent-root server has been configured with CORS (Cross-Origin Resource Sharing) support to handle requests from your frontend domains when deployed on Google Compute Engine.

### Environment Variables for CORS

1. **Development Mode (Allow All Origins)**:
   ```bash
   CORS_ALLOW_ALL=true
   ```
   This allows requests from any origin. **Use only for development**.

2. **Production Mode (Specific Origins)**:
   ```bash
   CORS_ALLOW_ALL=false
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://staging.yourdomain.com
   ```

### Google Compute Engine Setup

1. **Create a Compute Engine Instance**:
   - Choose an appropriate machine type
   - Allow HTTP and HTTPS traffic
   - Note the external IP address

2. **Set up your environment file** (`.env`):
   ```bash
   # Server Configuration
   SPEAKER_A2A_HOST=0.0.0.0
   SPEAKER_A2A_PORT=8003
   
   # CORS Configuration for production
   CORS_ALLOW_ALL=false
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://YOUR_GCE_EXTERNAL_IP,https://YOUR_GCE_EXTERNAL_IP
   
   # Add your other environment variables here
   GOOGLE_API_KEY=your_api_key
   # ... other vars
   ```

3. **Firewall Rules**:
   Make sure your GCE instance allows inbound traffic on port 8003:
   ```bash
   gcloud compute firewall-rules create allow-agent-root-server \
     --allow tcp:8003 \
     --source-ranges 0.0.0.0/0 \
     --description "Allow agent-root server traffic"
   ```

4. **Domain Configuration**:
   If you're using a custom domain, make sure to:
   - Point your domain's A record to your GCE external IP
   - Include your domain in the `ALLOWED_ORIGINS` environment variable
   - Consider using a reverse proxy like nginx for HTTPS termination

### Testing CORS

You can test CORS functionality using curl:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://YOUR_GCE_EXTERNAL_IP:8003/run

# Test actual request
curl -X POST \
  -H "Origin: https://yourdomain.com" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "context": {}}' \
  http://YOUR_GCE_EXTERNAL_IP:8003/run
```

### Security Considerations

- Never use `CORS_ALLOW_ALL=true` in production
- Always specify exact domains in `ALLOWED_ORIGINS`
- Consider using HTTPS for all production traffic
- Implement proper authentication and authorization
- Monitor CORS-related logs for security issues

### Troubleshooting

1. **CORS errors in browser console**:
   - Check that your domain is included in `ALLOWED_ORIGINS`
   - Verify the server is accessible from your domain
   - Check browser developer tools for specific CORS error messages

2. **Server not accessible**:
   - Verify firewall rules allow traffic on port 8003
   - Check that `SPEAKER_A2A_HOST` is set to `0.0.0.0` (not `127.0.0.1`)
   - Ensure the server is running and listening on the correct port

3. **Environment variables not loading**:
   - Verify the `.env` file is in the correct location
   - Check for syntax errors in the `.env` file
   - Ensure `python-dotenv` is installed
