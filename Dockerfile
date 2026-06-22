FROM node:20-bookworm

# ── Install PostgreSQL 15 + pgvector ────────────────────────
# pgvector is NOT in default Debian bookworm repos — add the PGDG apt repo first
RUN apt-get update && apt-get install -y --no-install-recommends \
      gnupg2 curl ca-certificates sudo \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      postgresql-15 \
      postgresql-15-pgvector \
      postgresql-client-15 \
    && rm -rf /var/lib/apt/lists/*

# ── Install n8n globally ────────────────────────────────────
RUN npm install -g n8n

# ── Set up app directory ────────────────────────────────────
WORKDIR /app

# Copy dependency definition for Express proxy server
COPY deploy-package.json ./package.json
RUN npm install --only=production

# Copy all project files
COPY . .


# Set permission for startup script
RUN chmod +x start.sh

# ── Prepare directories & permissions ───────────────────────
# PostgreSQL data, n8n config, and app — all owned by UID 1000
RUN mkdir -p /data/pgdata /home/node/.n8n /run/postgresql \
    && chown -R 1000:1000 /data /home/node /app /run/postgresql \
    && chown -R 1000:1000 /var/log/postgresql 2>/dev/null || true

# Give the node user (UID 1000) permission to run pg_ctlcluster
RUN echo "node ALL=(postgres) NOPASSWD: ALL" >> /etc/sudoers.d/node-pg \
    && chmod 0440 /etc/sudoers.d/node-pg

# Allow node user to run pg_ctlcluster and initdb
RUN chown -R 1000:1000 /etc/postgresql /var/lib/postgresql /var/run/postgresql 2>/dev/null; \
    chmod -R 775 /var/lib/postgresql /var/run/postgresql 2>/dev/null; true

# Switch to non-root user (UID 1000 — HF requirement)
USER 1000
ENV HOME=/home/node
ENV PGDATA=/data/pgdata

# Expose proxy port (Hugging Face default)
EXPOSE 7860

CMD ["./start.sh"]
