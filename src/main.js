const fs = require('fs');
var active_server_id = 0;

function listFiles() {
    //find all server folders and parse their properties
    const path = require('path');

    const directoryPath = document.getElementById("path_input").value.split(',');

    console.log(directoryPath);

    var server_list = [];

    directoryPath.forEach(server_path => {
        //find all server folders in the directory

        server_path = server_path.trim();

        fs.readdirSync(server_path).forEach(element => {

            //merge paths
            absoulutePath = path.join(server_path, element);


            if (fs.lstatSync(absoulutePath).isDirectory() && fs.readdirSync(absoulutePath).includes('server.properties')) {
                console.log(element, 'contains server.properties');
                server_list.push(absoulutePath);
            } else if (fs.lstatSync(absoulutePath).isDirectory()) {
                console.log(element, "doesn't contain server files");
            }


        });
    });


    var data = {}
    var data_temp = {}
    var count = 0;


    //parse server.properties files
    server_list.forEach(element => {
        var server_properties = fs.readFileSync(element + '/server.properties', 'utf8');
        data_temp = {};
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
    active_server_id = server_id;

    //console.log(data);

    hideDiv('settings_screen');
    showDiv('server_screen');

    document.getElementById('server_name').innerHTML = data.name;
    document.getElementById('server_path').innerHTML = data.path;
    document.getElementById('server_motd').innerHTML = data.properties.motd;

    var ul = document.getElementById("server_properties");

    //remove all children
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (var key in data.properties) {
        var li = document.createElement("li");
        li.setAttribute("class", "server_properties");


        //li.innerHTML = key + ': ' + data.properties[key];
        //ul.appendChild(li);


        var span = document.createElement("span");
        span.innerHTML = key + ":";

        //if property is a boolean, create a checkbox
        if (typeof data.properties[key] == 'boolean') {
            var checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", key);
            checkbox.setAttribute("onclick", "updateProperty(this.id, this.checked)");
            checkbox.checked = data.properties[key];
            span.appendChild(checkbox);
        } else {
            var input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("id", key);
            input.setAttribute("value", data.properties[key]);
            input.setAttribute("onchange", "updateProperty(this.id, this.value)");
            span.appendChild(input);
        }

        li.appendChild(span);
        ul.appendChild(li);

    }


    //server properties


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

function updateProperty(property, value) {
    //update property in server_list.json
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    data[active_server_id]['properties'][property] = value;
    fs.writeFileSync('server_list.json', JSON.stringify(data, null, 4));

}

// function saveServerProperties() {
//     //save server properties to server.properties
//     var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
//     var server_properties = data[active_server_id].properties;
//     var server_path = data[active_server_id].path;

//     var server_properties_file = fs.readFileSync(server_path + '/server.properties', 'utf8');

//     console.log(server_properties_file);
//     for (var key in server_properties) {
//         var line = key + '=' + server_properties[key] + '\r\n';
//         server_properties_file = server_properties_file.replace(new RegExp(key + '=.*\r\n', 'g'), line);
//     }

//     fs.writeFileSync(server_path + '/server.properties', server_properties_file);
//     console.log('saved');
// }

function saveServerProperties() {
    //save server properties to server.properties
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var server_properties = data[active_server_id].properties;
    var server_path = data[active_server_id].path;

    var output = '';

    //get first two lines of server.properties
    var server_properties_file = fs.readFileSync(server_path + '/server.properties', 'utf8');
    var lines = server_properties_file.split('\n');
    output += lines[0] + '\n' + lines[1] + '\n';

    //merge rest
    for (var key in server_properties) {
        output += key + '=' + server_properties[key] + '\n';
    }

    fs.writeFileSync(server_path + '/server.properties', output);
    console.log('saved');
}

function resetChanges() {

    listFiles();
    loadServer(active_server_id);

}