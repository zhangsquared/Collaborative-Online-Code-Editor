var redisClient = require('../modules/redisClient');
const TIMEOUT_IN_SECONDS = 3600; // 1 hour

module.exports = function(io) {

    var collaborations = {}; // a map; key: sessionID, value: a list of socket ID
    var socketIdToSessionId = {}; // a map; key: sessionId, value: socket ID

    var sessionPath = '/editorSocket/'; // namespace?

    // when connection event happens
    io.on('connection', (socket) => {
        let sessionId = socket.handshake.query['sessionId'];
        socketIdToSessionId[socket.id] = sessionId;

        // if(!(sessionId in collaborations)) {
        //     collaborations[sessionId] = {
        //         'participants': []
        //     };
        // }
        // collaborations[sessionId]['participants'].push(socket.id);

        if(sessionId in collaborations) {
            collaborations[sessionId]['participants'].push(socket.id);
        } else {
            redisClient.get(sessionPath + sessionId, function(data) {
                if(data) {
                    console.log('session terminated previously, pulling back from redis');
                    collaborations[sessionId] = {
                        'cachedInstruction': JSON.parse(data),
                        'participants': []
                    };
                } else {
                    console.log('creating new sessionId');
                    collaborations[sessionId] = {
                        'cachedInstruction': [],
                        'participants': []
                    };
                }
                collaborations[sessionId]['participants'].push(socket.id);
            });
        }

        socket.on('change', delta => {
            console.log('change ' + socketIdToSessionId + ' ' + delta);
            let sessionId = socketIdToSessionId[socket.id];
            if(sessionId in collaborations){
                collaborations[sessionId]['cachedInstruction'].push(
                    ["change", delta, Date.now()]
                );

                let participants = collaborations[sessionId]['participants'];
                for(let i = 0; i < participants.length; i++) {
                    if(socket.id != participants[i]) {
                        io.to(participants[i]).emit("change", delta);
                    }
                }
            } else {
                console.log('warning: cannot find socket id to any collaborations: ' + sessionId);
            }
        });

        socket.on('restoreBuffer', () => {
            let sessionId = socketIdToSessionId[socket.id];
            console.log(`restore bugger for session ${sessionId}, socket ${socket.id}`);

            if(sessionId in collaborations) {
                let instructions = collaborations[sessionId]['cachedInstruction'];
                for(let i = 0; i < instructions.length; i++) {
                    socket.emit(instructions[i][0], instructions[i][1]);
                }
            } else {
                console.log('warning: could not find socket id in collaborations');
            }
        });

        socket.on('disconnect', () => {
            let sessionId = socketIdToSessionId[socket.id];
            console.log(`socket ${socket.id} disconnected from session ${sessionId}`);

            let foundAndRemoved = false;
            if(sessionId in collaborations) {
                let participants = collaborations[sessionId]['participants'];
                let index = participants.indexOf(socket.id);

                if(index > -1) {
                    participants.splice(index, 1);
                    foundAndRemoved = true;

                    if(participants.length == 0) {
                        console.log(`last participant in collaboration, 
                        committing to redis and remove form memory`);

                        let key = sessionPath + sessionId;
                        let value = JSON.stringify(collaborations[sessionId]['cachedInstruction']);

                        redisClient.set(key, value, redisClient.redisPrint);

                        redisClient.expire(key, TIMEOUT_IN_SECONDS);

                        delete collaborations[sessionId];
                    }
                }
            }

            if(!foundAndRemoved) {
                console.log('warning: cound not find socket id in collaborations');
            }
        })

    })
}