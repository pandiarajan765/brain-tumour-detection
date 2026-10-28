# Base image with Node.js 20 LTS
FROM node:20-slim

# Install Python 3, pip, and virtualenv tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Set up isolated Python virtual environment & install requirements
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose default HTTP port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=/opt/venv/bin/python

CMD ["npm", "start"]
