import { Server, Socket } from 'socket.io';

// Define event names for better structure
const EVENT_CONNECTION = 'connection';
const EVENT_DISCONNECT = 'disconnect';
const EVENT_GET_ME = 'call:getMe';
const EVENT_PEERS_ONLINE = 'call:peersOnline';
const EVENT_CALL_USER = 'call:initiate';
const EVENT_ANSWER_CALL = 'call:answer';
const EVENT_CANDIDATE = 'call:candidate';
const EVENT_END_CALL = 'call:end';
const EVENT_CALL_ACCEPTED = 'call:accepted';
const EVENT_CALL_INCOMING = 'call:incoming';

export const initializeCallNamespace = (io: Server) => {
  const callNamespace = io.of('/call');
  callNamespace.use(authenticate);

  const trackIds = new Set<string>();

  // Handle new connections
  callNamespace.on(EVENT_CONNECTION, (socket: Socket) => {
    const userId = socket.user._id;

    socket.join(userId);

    console.log(`User connected for calling: ${userId}`);
    trackIds.add(userId); // Track connected users

    // Emit user's own ID
    socket.on(EVENT_GET_ME, () => socket.emit('call:me', userId));

    // Emit online peers
    socket.on(EVENT_PEERS_ONLINE, () => {
      console.log('Peers connected');

      socket.emit(EVENT_PEERS_ONLINE, {
        ids: [...trackIds],
        newPeer: userId,
      });
    });

    // Notify all clients of updated peer list
    callNamespace.emit(EVENT_PEERS_ONLINE, {
      ids: [...trackIds],
      newPeer: userId,
    });

    // Handle outgoing call
    socket.on(EVENT_CALL_USER, ({ userToCall, signalData }) => {
      console.log('calling user ', userToCall, ' by ', socket.user._id);

      callNamespace
        .to(userToCall)
        .emit(EVENT_CALL_INCOMING, {
          signal: signalData,
          from: socket.user._id,
        });
    });

    // Handle answering a call
    socket.on(EVENT_ANSWER_CALL, ({ to, signal }) => {
      console.log('Answering to user ...', to);
      callNamespace.to(to).emit(EVENT_CALL_ACCEPTED, signal);
    });

    // Handle ICE candidates
    socket.on(EVENT_CANDIDATE, ({ to, candidate }) => {
      console.log('sending ice candidate to : ', to);

      callNamespace.to(to).emit(EVENT_CANDIDATE, { candidate });
    });

    // Handle call end
    socket.on(EVENT_END_CALL, () => {
      console.log('Ending call... by ', socket.user._id);
      socket.broadcast.emit('call:ended');
    });

    // Handle disconnection
    socket.on(EVENT_DISCONNECT, () => {
      console.log(`User disconnected: ${userId}`);
      trackIds.delete(userId); // Remove user from the set
      callNamespace.emit(EVENT_PEERS_ONLINE, { ids: [...trackIds] }); // Update peer list
    });
  });
};

const authenticate = (socket: Socket, next: (err?: Error) => void) => {
  const userId = socket.handshake.auth.token;

  console.log(userId);

  if (!userId) {
    return next(new Error('Unauthorized: No token provided'));
  }

  socket.user = { _id: userId };

  next();
};
