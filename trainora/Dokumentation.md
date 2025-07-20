//Ollama API
    http://localhost:11434

    //cmd command - Ollama API Test
    curl http://localhost:11434/api/generate -d '{
        "model": "llama3",
        "prompt": "Wie geht es dir?"
    }'

    //Windows cmd prompt
    curl http://localhost:11434/api/generate -d "{\"model\":\"llama3\",\"prompt\":\"Wie geht es dir?\"}"


//Go/Golang
    cmd test: go version

    //go projekt anlegen
    go mod init deinprojektname

    //Fiber installieren
    go get github.com/gofiber/fiber/v2

    //Backend starten
    go run main.go

    //Port
    http://localhost:3000


//React
    http://localhost:5173

    cmd: npm create vite@latest meine-website -- --template react-ts //projekt erstellen