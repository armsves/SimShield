# Use the official Python image
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Set the working directory
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port (Cloud Run sets PORT to 8080 by default)
ENV PORT 8080

# Command to run the application
# Use 4 workers for production, adjust as needed
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
