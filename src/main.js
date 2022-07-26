const fs = require('fs');

function listFiles() {
    const path = require('path');

    const directoryPath = document.getElementById("path_input").value;

    var server_list = [];

    //find all server folders in the directory
    fs.readdirSync(directoryPath).forEach(element => {

        //merge paths
        absoulutePath = path.join(directoryPath, element);


        if (fs.lstatSync(absoulutePath).isDirectory() && fs.readdirSync(absoulutePath).includes('server.properties')) {
            console.log(element, 'contains server.properties');
            server_list.push(absoulutePath);
        } else if (fs.lstatSync(absoulutePath).isDirectory()) {
            console.log(element, "doesn't contain server files");
        }


    });

    //console.log(server_list);

    var data = {}
    var data_temp = {}
    var count = 0;


    //parse server.properties files
    server_list.forEach(element => {
        var server_properties = fs.readFileSync(element + '/server.properties', 'utf8');
        //for each line in the server.properties file
        server_properties.split('\n').forEach(line => {
            //if the line starts with a #, ignore it
            if (!line.startsWith('#')) {
                //if the line starts with a property, split it into key and value
                var property = line.replace('\r', '').split('=');

                if (property[1] != undefined) {

                    if (property[1] == 'true') {
                        property[1] = true;
                    } else if (property[1] == 'false') {
                        property[1] = false;
                        //check if integer
                    } else if (property[1].match(/^[0-9]+$/)) {
                        property[1] = parseInt(property[1]);
                    }
                }

                data_temp[property[0]] = property[1];
            }
        });
        let j = { 'id': count, 'name': element.split('\\').pop(), 'path': element, 'images': [], 'properties': data_temp };
        data[count.toString()] = j;
        count++;
    });

    //convert data to json and save to file
    fs.writeFileSync('server_list.json', JSON.stringify(data, null, 4));

    loadIntoBar();

}

function loadIntoBar() {
    //load server_list.json into the scrollbar
    var ul = document.getElementById("serverlist");

    //remove all children, except the first one
    for (var i = ul.children.length - 1; i > 0; i--) {
        ul.removeChild(ul.children[i]);
    }



    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    for (var key in data) {

        var li = document.createElement("li");
        var button = document.createElement("button");

        button.setAttribute("id", data[key].id);
        button.setAttribute("onclick", "loadServer(this.id)");
        button.style.width = "100%";
        button.innerHTML = data[key].name;

        li.appendChild(button);
        ul.appendChild(li);

    }

}

function loadServer(server_id) {
    //load server details into main page
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    data = data[server_id];

    //console.log(data);
    
    hideDiv('settings_screen');
    showDiv('server_screen');

    document.getElementById('server_name').innerHTML = data.name;

}

function showDiv(div_id) {
  var x = document.getElementById(div_id);
  x.style.display = "block";
}

function hideDiv(div_id) {
  var x = document.getElementById(div_id);
  x.style.display = "none";
}

function showSettings() {
    hideDiv('server_screen');
    showDiv('settings_screen');
}