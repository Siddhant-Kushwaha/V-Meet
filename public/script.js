
let username;
let nameAttempts=0;
while(!username){
  if(nameAttempts>0){
    username=prompt("Name is Mandatory!");
  }
  else username=prompt('Enter Your Name');
  nameAttempts++;
}
// username="siddhant";
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const leave=document.querySelector('.leave_meeting');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
let fileShare = {}
let myVideoStream;
let screenSharing=false;
let screenStream;
let myId;




const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream)
    myPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
      })
      call.on('close',()=>{
        video.remove();
      })
      console.log('answer',call);
      peers[call.peer]=call;
    })

    socket.on('user-connected', userId => {
      setTimeout(() => {
        connectToNewUser(userId, stream)
      }, 1500)
    })
    console.log('what\nthe');
    // when press enter send message
    let text = document.querySelector("#chat_message");
window.addEventListener('keydown', function (e) {
  console.log('3');
  console.log(e.key);
  console.log(text.value.length);
  if (e.key === 'Enter' && text.value.length !== 0) {
    console.log('press');
    socket.emit('message', {message:text.value,name:username});
    text.value = ''
  }
});
socket.on("createMessage", data => {
  console.log("ran");
  const ul = document.querySelector('ul');

  const li = document.createElement('li');
  li.classList.add('message');
  const b = document.createElement('b');
  b.append(data.name);
  const br = document.createElement('br');
  const text = document.createTextNode(`${data.message}`);
  li.append(b);
  li.append(br);
  li.append(text);
  ul.append(li);
  scrollToBottom()
})
    
})

socket.on('user-disconnected', userId => {
  console.log('user-disconnected\n');
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  myId=id;
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  if(screenSharing)stream=screenStream;
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
  console.log('call:',call)
  console.log(myId)
  console.log(userId);
  console.log(myPeer);
  console.log(call.peerConnection.getSenders());
  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

leave.addEventListener('click',()=>{
socket.emit('leave-meeting');
window.location.replace('/');
})

const scrollToBottom = () => {
  var d = document.querySelector('.main__chat_window');
  d.scrollTop = d.scrollHeight;
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `<i class= "fas fa-microphone">`
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `<i class= "unmute fas fa-microphone-slash" >`
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `<i class= "fas fa-video">`;
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = ` <i class= "stop fas fa-video-slash">`;
  document.querySelector('.main__video_button').innerHTML = html;
}

document.querySelector('.screen-share').addEventListener('click',startScreenShare);

function startScreenShare() {
  if (screenSharing) {
      stopScreenSharing()
      return;
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
      screenStream = stream;
      let videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
          stopScreenSharing()
      }
      for(let currentPeer in peers){
          let sender = peers[currentPeer].peerConnection.getSenders().find(function (s) {

              return s.track.kind == videoTrack.kind;
          })
          sender.replaceTrack(videoTrack)
      }
      screenSharing = true
      // console.log(screenStream)
  })
}

function stopScreenSharing() {
  if (!screenSharing) return;
  let videoTrack = myVideoStream.getVideoTracks()[0];

  for (let currentPeer in peers){
    let sender = peers[currentPeer].peerConnection.getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    })    
    sender.replaceTrack(videoTrack)
  }

  screenStream.getTracks().forEach(function (track) {
      track.stop();
  });
  screenSharing = false
}

document.querySelector("#file-input").addEventListener("change",function(e){
  let file = e.target.files[0];
  if(!file){
    return;		
  }
  let reader = new FileReader();
  
  reader.onload = function(e){
    let buffer = new Uint8Array(reader.result);
    // console.log(buffer)
    shareFile({
      filename: file.name,
      total_buffer_size:buffer.length,
      buffer_size:4096,
    }, buffer);
  }
  reader.readAsArrayBuffer(file);
});



  



	socket.on("fs-meta",function(data){
		fileShare.metadata = data.metadata;

		fileShare.transmitted = 0;
		fileShare.buffer = [];

    console.log(data.uid)
		socket.emit("fs-start",{
      uid:data.uid

    })

	});
  

function shareFile(metadata,buff){
  socket.emit("file-meta",{
    uid:myId,
    metadata:metadata
  });
 
  
socket.on("fs-sh",function(){

  let chunk = buff.slice(0,metadata.buffer_size);
  buff = buff.slice(metadata.buffer_size,buff.length);
  if(chunk.length != 0){

    socket.emit("file-raw", {
      uid:myId,
      buffer:chunk});
  } else {
    console.log("Sent file successfully");
  }
});
}

	socket.on("fs-share",function(data){
    let arr=Object.keys(data.buffer).map(key=>data.buffer[key])
    data.buffer=Uint8Array.from(arr)

		fileShare.buffer.push(data.buffer);
		fileShare.transmitted = fileShare.transmitted + data.buffer.byteLength;

		if(fileShare.transmitted == fileShare.metadata.total_buffer_size){

			download(new Blob(fileShare.buffer), fileShare.metadata.filename);
			fileShare = {};
		} else {
			socket.emit("fs-start",{
        uid:data.uid
      })
		}
	});




