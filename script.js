window.addEventListener('load', function () {
    const socket = io("ws://localhost:8085", {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    function send(){
        let input = document.getElementById("txfInput").value;
        document.getElementById("txaChatBox").append("[You]: " + input + "\n");
        socket.emit('chat', {
            'message': input
        });
        document.getElementById("txfInput").value = "";
    }


    socket.on('welcome', function(data){
        document.getElementById("txaChatBox").append('[Bot]: You are connected, your ID is "' + data.socketId + '"\n');
    });

    socket.on('chat', function(data){
        document.getElementById("txaChatBox").append("[Bot]: " + data.message + "\n");
    });

    document.getElementById("btnSend").addEventListener("click", send);

});

