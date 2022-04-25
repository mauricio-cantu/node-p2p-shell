import net from 'net';
import { exec } from 'child_process';

export default class Peer {
    constructor(port, id) {
        this.port = port;
        this.id = id;
        this.connections = [];
        const server = net.createServer( (socket) => {
            this.onSocketConnected(socket)
        });
        server.listen(port, () => console.log(`${id} conectado na porta ${port}`) )
    }

    connectTo(address) {
        if(address.split(":").length !== 2){
            throw Error("Endereço inválido");
        }
        const [ host, port ] = address.split(":");
        const socket = net.createConnection({ port, host }, () =>
            this.onSocketConnected(socket)
        );
    }

    onSocketConnected(socket) {
        this.connections.push(socket);
        socket.on('data', (data) =>
           this.onData(socket, data)
        );
        socket.on('close', () => {
            this.connections = this.connections.filter( conn => {
                return conn !== socket;
            })
        });
    }

    // executado toda vez que uma mensagem é recebida
    onData(socket, data) {
        const payload = JSON.parse(data);
        
        // situação 1: mensagem disparada quando o usuario executa um comando em um dos peer (index.js linha 31)
        if (payload.command) {
            console.log('\x1b[36m%s\x1b[0m', `${payload.peerId} > Solicitou o comando '${payload.command}'`)
            // executa o comando na maquina de outro peer da rede
            exec(payload.command, (err, stdout) => {
                let result = stdout || 'Comando executado com sucesso.';
                if(err) {
                    result = 'Erro na execução do comando';
                } 
                // manda resultado do comando para os outros peers (ownerId: peer "origem", onde o comando foi executado primeiramente)
                this.broadcast(JSON.stringify({ result, peerId: this.id, ownerId: payload.peerId }));
            })
        } 
        // situação 2: mensagem apenas com o resultado do comando executado em peer diferente do peer origem (linha 50)
        else {
            // exibe o resultado do comando apenas no peer origem, onde o comando foi executado primeiramente
            if(this.id === payload.ownerId) {
                console.log('\x1b[33m%s\x1b[0m', `(${payload.peerId}) Resultado:`)
                console.log(payload.result);
            }
        }
    }

    // envia mensagem pra todos peers na rede
    broadcast(data) {
        this.connections.forEach( socket => socket.write(data) )
    }
    
}