FROM caddy:2-builder AS builder

# 设置 Go 代理（国内镜像）
ENV GOPROXY=https://goproxy.cn,direct

RUN xcaddy build \
    --with github.com/caddy-dns/alidns

FROM caddy:2

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
