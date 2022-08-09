const app = require("express")()
const http = require("http")
const server = http.createServer(app)

const cors = require("cors")

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
})

app.use(cors())

const rooms = []//Room -> [Sockets]

const socketToRoom = [] //Socket -> Room

io.on('connection', socket => {
  socket.on("join_room", roomID => {
    if(!rooms[roomID] || !rooms[roomID].length){
      rooms[roomID] = [socket.id]
      socketToRoom[socket.id] = roomID
      return
    }
    let len = rooms[roomID].length

    if(len==2){ /* Atmost 2 users in a room */
      socket.emit('room_full')
    }
    else if(len==1){
      const peer = rooms[roomID][0]
      rooms[roomID].push(socket.id)
      socketToRoom[socket.id] = roomID
      socket.emit("peer", peer)
    }
  })

  socket.on("sending_signal", payload => {
    io.to(payload.userToSignal).emit('user_joined', { signal: payload.signal, callerID: payload.callerID });
  })

  socket.on("returning_signal", payload => {
    io.to(payload.callerID).emit('receiving_returned_signal', { signal: payload.signal, id: socket.id });
  })

  socket.on('disconnect', () => { /* Remove user from room */
    const roomID = socketToRoom[socket.id]
    if(rooms[roomID]) rooms[roomID] = rooms[roomID].filter(id => id !== socket.id)
    socketToRoom[socket.id] = ''
  })

});

server.listen(process.env.PORT, () => console.log(`SERVER RUNNING ON PORT ${process.env.PORT}`))
