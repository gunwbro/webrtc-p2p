const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let peerConnection;

async function init() {
  try {
    const constraints = { video: true, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const localVideo = document.querySelector("video.localVideo");
    const remoteVideo = document.querySelector("video.remoteVideo");
    localVideo.srcObject = stream; // html video elem 에 로컬 스트림 추가

    peerConnection = new RTCPeerConnection(configuration);
    console.log("Peer Connection 생성", peerConnection);

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      console.log("New Candidate!");
      if (event.candidate) {
        console.log(JSON.stringify(event.candidate));
      }
    };

    peerConnection.onconnectionstatechange = (event) => {
      if (peerConnection.connectionState === "connected") {
        console.log("WebRTC 연결 완료!");
      }
    };
  } catch (error) {
    console.error("Error opening video camera.", error);
  }
}

async function createOffer() {
  console.log("Create Offer");

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  return JSON.stringify(offer);
}

async function createAnswer(offer) {
  console.log("Get Offer: ", offer);
  offer = JSON.parse(offer);
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  return JSON.stringify(answer);
}

async function getAnswer(answer) {
  console.log("Get Answer: ", answer);
  answer = JSON.parse(answer);

  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function setRemoteCandidate(candidate) {
  candidate = new RTCIceCandidate(JSON.parse(candidate));
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.log("setRemoteCandidate Error", e);
  }
}

init();
// 시그널링 서버를 사용하지 않기 위해
// 직접 콘솔로 찍어서 연결
// createOffer(피어1) -> createAnswer(피어2) ->
// getAnswer(피어1) -> getLocalCandidate(피어1, 피어2) -> setRemoteCandidate(피어1, 피어2)
