FROM ollama/ollama

# curl installieren (benutzt Debian/Ubuntu)
RUN apt-get update && apt-get install -y curl dos2unix

# Kopiere init-Skript in den Container
COPY init.sh /init.sh

# Zeilenenden sicher umwandeln und ausführbar machen
RUN dos2unix /init.sh && chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
