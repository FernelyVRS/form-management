FROM node:22.13.0

WORKDIR /app

# The bundled Corepack in this Node image ships outdated registry signing keys
# and fails with "Cannot find matching keyid". Disable that verification; the
# pnpm version is still pinned by "packageManager" in package.json.
ENV COREPACK_INTEGRITY_KEYS=0
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

# Re-runs install on start so a bind-mounted package.json change is picked up,
# then starts Vite with hot reload listening on all interfaces.
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm dev --host 0.0.0.0 --port 5173 --strictPort"]
