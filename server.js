const WebSocket = require('ws');

// Render asigna el puerto en process.env.PORT
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ 
    port: PORT,
    host: '0.0.0.0'
});

// Guardamos directamente la referencia del WebSocket de cada jugador
let estadoJuego = {
    mario: null,
    luigi: null
};

console.log(`Servidor multijugador iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    let rolAsignado = null;

    // Asignación segura de roles
    if (!estadoJuego.mario) {
        rolAsignado = "mario";
        estadoJuego.mario = ws;
    } else if (!estadoJuego.luigi) {
        rolAsignado = "luigi";
        estadoJuego.luigi = ws;
    } else {
        rolAsignado = "espectador";
    }

    // Le informamos al cliente qué rol le tocó
    ws.send(JSON.stringify({
        tipo: "asignar_rol",
        rol: rolAsignado
    }));

    console.log(`Cliente conectado como: ${rolAsignado}`);

    // Escuchar mensajes entrantes
    ws.on('message', (message) => {
        try {
            // Retransmitir a TODOS los clientes excepto al que lo envió
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message.toString());
                }
            });
        } catch (error) {
            console.error("Error procesando mensaje:", error);
        }
    });

    // Limpieza cuando un jugador cierra la ventana o se desconecta
    ws.on('close', () => {
        console.log(`Cliente (${rolAsignado}) desconectado`);

        if (rolAsignado === "mario") {
            estadoJuego.mario = null;
        } else if (rolAsignado === "luigi") {
            estadoJuego.luigi = null;
        }

        // Avisar a los clientes restantes
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    tipo: "jugador_desconectado",
                    rol: rolAsignado
                }));
            }
        });
    });

    ws.on('error', (err) => {
        console.error(`Error en socket (${rolAsignado}):`, err);
    });
});