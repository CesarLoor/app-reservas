FROM node:18-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api/auth
ARG NEXT_PUBLIC_BOOKING_URL=/api/bookings
ARG NEXT_PUBLIC_USER_URL=/api/users

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BOOKING_URL=$NEXT_PUBLIC_BOOKING_URL
ENV NEXT_PUBLIC_USER_URL=$NEXT_PUBLIC_USER_URL

COPY package.json package-lock.json* ./
COPY . .

RUN npm install
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
