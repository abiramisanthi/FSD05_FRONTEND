FROM nginx:alpine

# Copy static frontend files to nginx html directory
COPY . /usr/share/nginx/html

# Custom nginx config to support Single Page Application routing (fallback to index.html)
RUN echo 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
