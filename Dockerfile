FROM gliderlabs/alpine:3.6

WORKDIR /build
COPY . /build

RUN apk add --update \
nodejs \
nodejs-npm \
&& rm -rf /var/cache/apk/* \
&& npm install -g npm@5.4.2 pm2 \
&& npm it \
&& npm run build \
&& mkdir -p -m 0777 /app/bin \
&& cp -R dist/* /app/bin \
&& cp package.json /app \
&& cd /app \
&& npm i --only="prod" \
&& rm -rf /build \
&& mkdir -p -m 0777 /var/log/kalemail \
&& npm cache clean --force

WORKDIR /app

ENTRYPOINT ["pm2-docker", "bin/server/app.js", "-l /var/log/kalemail/kalemail.logs"]
