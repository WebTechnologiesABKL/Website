window.addEventListener('load', function () {
    const socket = io("ws://localhost:8085", {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    function send(){
        let input = document.getElementById("txfInput").value;
        if(input){
            let ul = document.getElementById("chat");
            let li = document.createElement("li");
            li.appendChild(document.createTextNode(input));
            li.setAttribute("class", "user");
            ul.appendChild(li);
            socket.emit('chat', {
                'message': input
            });
            document.getElementById("txfInput").value = "";
        }
    }


    socket.on('welcome', function(data){
        let ul = document.getElementById("chat");
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(data.message));
        li.setAttribute("class", "bot");
        ul.appendChild(li);
    });

    socket.on('chat', function(data){
        let ul = document.getElementById("chat");
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(data.message));
        li.setAttribute("class", "bot");
        ul.appendChild(li);
    });

    socket.on('writing', function (data) {
        if(data.active){
            let ul = document.getElementById("chat");
            let li = document.createElement("li");
            li.appendChild(document.createTextNode("..."));
            li.setAttribute("class", "bot");
            li.setAttribute("id", "writing");
            ul.appendChild(li);
        }else{
            let writing = document.getElementById('writing');
            let chat = document.getElementById('chat');
            chat.removeChild(writing);
        }
    })

    document.getElementById("btnSend").addEventListener("click", send);

});

