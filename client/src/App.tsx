import React, { useEffect, useRef } from "react";
import {io, Socket} from "socket.io-client";
const pc_config = {
  iceServers: [
    // {
    //   urls: 'stun:[STUN_IP]:[PORT]',
    //   'credentials': '[YOR CREDENTIALS]',
    //   'username': '[USERNAME]'
    // },
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};
const SOCKET_SERVER_URL = "http://localhost:8000";

function App() {
  const socketRef = useRef<Socket>();
  const pcRef = useRef<RTCPeerConnection>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const setVideoTracks = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if(localVideoRef.current) localVideoRef.current.srcObject = stream;
      if(!(pcRef.current && socketRef.current)) return;

      stream.getTracks().forEach((track)=>{
        if(!pcRef.current) return;
        pcRef.current.addTrack(track, stream)
      })

      pcRef.current.onicecandidate = (event) => {
        if(event.candidate) {
          if(!socketRef.current) return;
          console.log('onicecandidate: ', event.candidate);
          socketRef.current.emit("candidate", event.candidate)
        }
      }

      pcRef.current.onconnectionstatechange = (event) => {
        console.log(event);
      }

      pcRef.current.ontrack = (event) => {
        if(remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      socketRef.current.emit("join_room", {
        room: "1234",
      });
    } catch(error) {
      console.error(error);
    }
  };
  const createOffer = async () => {
    console.log("Create offer:");
    if (!(pcRef.current && socketRef.current)) return;
    try {
      const sdp = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await pcRef.current.setLocalDescription(new RTCSessionDescription(sdp))
      socketRef.current.emit("offer", sdp)
    } catch(error) {
      console.log(error);
    }

  }
  const createAnswer = async (sdp: RTCSessionDescription) => {
    if (!(pcRef.current && socketRef.current)) return;
    try { 
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const mySdp = await pcRef.current.createAnswer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      console.log("Create answer:")
      await pcRef.current.setLocalDescription(new RTCSessionDescription(mySdp));
      socketRef.current.emit("answer", mySdp);
    } catch(error){
      console.log(error);
    }
  };

  useEffect(()=>{
    socketRef.current = io(SOCKET_SERVER_URL)
    pcRef.current = new RTCPeerConnection(pc_config)

    socketRef.current.on("all_users", (allUsers: Array<{id: string}>)=>{
      if(allUsers.length > 0){
        createOffer();
      }
    })
    
    socketRef.current.on("getOffer", (sdp: RTCSessionDescription) => {
      console.log("Get Offer: ");
      createAnswer(sdp)
    })

    socketRef.current.on("getAnswer", (sdp: RTCSessionDescription) => {
      console.log("Get Answer");
      if(!pcRef.current) return;
      pcRef.current.setRemoteDescription(sdp)
    })

    socketRef.current.on("getCandidate", async (candidate: RTCIceCandidate) => {
      if(!pcRef.current) return;
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("Candidate is added successful.");
    })

    setVideoTracks();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    }; 
  }, [])
  return (
    <div>
      <video
      style={{
        width: 240,
        height: 240,
        margin: 5,
        background: "black"
      }}
      muted
      ref={localVideoRef}
      autoPlay
      >
      </video>
      <video 
      style={{
        width: 240,
        height: 240,
        margin: 5,
        background: "black"
      }}
      muted
      ref={remoteVideoRef}
      autoPlay
      >

      </video>
    </div>
  );
}

export default App;
