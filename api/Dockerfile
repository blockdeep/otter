FROM node:20-bullseye

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install only what you need to build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Now copy the actual source code
COPY . .

RUN pnpm db:setup:dev

# 👇 Build TypeScript into /dist
RUN pnpm build

# Then start the compiled code
CMD ["pnpm", "start"]

EXPOSE 3000
