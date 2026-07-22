const WebSocket = require('ws');
const PORT = process.env.PORT || 8080; // Usa el puerto de hosting o el 8080 por defecto
const wss = new WebSocket.Server({ port: PORT });

let estadoJuego = {
    mario: null, // Guardará la referencia al WebSocket de Mario
    luigi: null // Guardará la referencia al WebSocket de Luigi
};

console.log(`Servidor multijugador iniciado en el puerto ${PORT}`);

// Guardar todos los clientes conectados
let clientes = [];

wss.on('connection', (ws) => {
    // 1. ASIGNACIÓN INTELIGENTE DE ROLES
    let rolAsignado = "";

    if (!estadoJuego.mario) {
        rolAsignado = "mario";
        estadoJuego.mario.ws;
    } else if (!estadoJuego.luigi) {
        rolAsignado = "luigi";
        estadoJuego.luigi.ws;
    } else {
        rolAsignado = "espectador"
    }

    // Le informamos al jugador cuál es su rol
    ws.send(JSON.stringify({
        tipo: "asignar_rol",
        rol: rolAsignado
    }));

    console.log(`Cliente conectado como: ${rolAsignado}`);

    // 2. RECEPCIÓN Y MANEJO DE MENSAJES
    ws.on('message', (message) => {
        try {
            // Retransmitir ÚNICAMENTE a los otros jugadores conectados (no al que envió)
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message.toString());
                }
            });
        } catch (error) {
            console.error("Error al procesar mensaje:", error);
        }
    });

    // 3. LIMPIEZA AL DESCONECTARSE (Crucial)
    ws.on('close', () => {
        console.log(`Cliente ${rolAsignado} se ha desconectado.`);

        // Liberar el rol para que otra persona pueda entrar y usar a ese personaje
        if (rolAsignado === "mario") estadoJuego.mario = null;
        if (rolAsignado === "luigi") estadoJuego.luigi = null;

        // Opcional: Avisar al cliente restante que el otro se fue
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    tipo: "jugador_desconectado",
                    rol: rolAsignado
                }));
            }
        });
    });

    ws.on('error', (err) => console.error(`Error en cliente ${rolAsignado}:`, err));
});
