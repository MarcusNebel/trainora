FROM ollama/ollama

# curl installieren (benutzt Debian/Ubuntu)
RUN apt-get update && apt-get install -y curl

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
