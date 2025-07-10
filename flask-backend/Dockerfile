# Use official Python image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN apt-get update && apt-get install -y libgl1


# Expose the port (change if needed)
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
