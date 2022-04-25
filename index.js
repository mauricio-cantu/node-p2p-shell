if(!process.env.PORT || !process.env.ID) {
    throw Error('É necessário definir a porta e o ID do peer.');
}

import Peer from "./Peer.js";
import { exec } from 'child_process';
const port = process.env.PORT;
const peerId = process.env.ID;
const peer = new Peer(port, peerId);

const args = process.argv || [];
// endereços de outros peers ao qual o peer atual vai se conectar
const hosts = args.slice(2);
hosts.forEach(otherPeerHost => 
    peer.connectTo(otherPeerHost) 
);

// executado toda vez que o user digitar um comando em um dos peer
process.stdin.on('data', data => {
    const command = data.toString().replace(/\n/g, "");
    // executa comando na maquina do proprio peer em que o comando foi digitado
    exec(command, (err, stdout) => {
        let result = stdout || 'Comando executado com sucesso';
        if(err){
            result = 'Erro na execução do comando';
        }

        // imprime resultado na maquina do proprio peer em que o comando foi digitado
        console.log('\x1b[33m%s\x1b[0m', `(${peerId}) Resultado:`)
        console.log(result);

        // envia comando para os demais peers (peerId: peer "origem", onde o comando foi executado primeiramente)
        peer.broadcast(JSON.stringify({ command, peerId }));
    })
})