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

const userData = [{}]//socketId of user, name

io.on('connection', socket => {
  socket.on("join_room", ({roomID, userName}) => {
    if(!userName || userName.length===0) userName = "Anonymous"

    if(!rooms[roomID] || !rooms[roomID].length){
      rooms[roomID] = [socket.id]
      userData[socket.id] = {userName, roomID}
      return
    }
    let len = rooms[roomID].length

    if(len==2){ /* Atmost 2 users in a room */
      socket.emit('room_full')
    }
    else if(len==1){
      const peerID = rooms[roomID][0]
      const {userName} = userData[peerID]
      const peerName = userName
      rooms[roomID].push(socket.id)
      userData[socket.id] = {userName, roomID}
      socket.emit("peer", {peerID, peerName})
    }
  })

  socket.on("sending_signal", ({userToSignal, signal, callerID, callerName}) => {
    io.to(userToSignal).emit('user_joined', { signal, callerID, callerName })
  })

  socket.on("returning_signal", ({callerID, signal}) => {
    io.to(callerID).emit('receiving_returned_signal', { signal: signal, id: socket.id });
  })

  socket.on('disconnect', () => { /* Remove user from room */
    if(!userData[socket.id]) return
    const {roomID, userName} = userData[socket.id]
    if(rooms[roomID]) rooms[roomID] = rooms[roomID].filter(id => id !== socket.id)
  })

});

server.listen(process.env.PORT, () => console.log(`SERVER RUNNING ON PORT ${process.env.PORT}`))
