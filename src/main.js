const fs = require('fs');
const os = require('os');

const system_memory = os.totalmem() / 1024 / 1024;

var active_server_id = 0;
var temp_settings_data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

//startup
loadIntoBar();

//load config
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
document.getElementById("path_input").value = config.search_path;

function saveConfig() {
    //save config to config.json
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
}


function listFiles() {
    //find all server folders and parse their properties
    const path = require('path');

    const directoryPath = document.getElementById("path_input").value.split(',');
    //save path to config
    config.search_path = document.getElementById("path_input").value;
    saveConfig();

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
        var server_images;
        var server_args;
        data_temp = {};

        //check if server.json exists
        if (fs.existsSync(element + '/server.json')) {
            server_data = JSON.parse(fs.readFileSync(element + '/server.json', 'utf8'));
            server_images = server_data.images;
            server_args = server_data.args;
        } else {
            fs.writeFileSync(element + '/server.json', JSON.stringify({'args':{},'images':[]}, null, 4));
        }


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
        let j = { 'id': count, 'name': element.split('\\').pop(), 'path': element, 'args': server_args, 'images': server_images,'properties': data_temp };
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
    /**
    *load server details into main page
    **/
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var startup_data = JSON.parse(fs.readFileSync(data[server_id].path + '/server.json', 'utf8'));

    data = data[server_id];
    active_server_id = server_id;

    //general info
    document.getElementById('server_name').innerHTML = data.name;
    document.getElementById('server_path').innerHTML = data.path;
    document.getElementById('server_motd').innerHTML = data.properties.motd;


    //images
    var images = data.images;

    var image_container = document.getElementById("server_images");

    //remove all children (images)

    while (image_container.firstChild) {
        image_container.removeChild(image_container.firstChild);
    }

    if (images != undefined) {

        images.forEach(item => {
            var img = document.createElement("img");
            img.src = item;
            img.style.width = "30%";
            img.style.paddingRight = "2%";
            image_container.appendChild(img);
        });
    }

    //startup properties

    var Xmx_slider = document.getElementById('Xmx_slider');
    var Xmx_value = document.getElementById('Xmx_value');
    var Xms_slider = document.getElementById('Xms_slider');
    var Xms_value = document.getElementById('Xms_value');

    var server_jar = document.getElementById('server_jar');

    Xmx_slider.max = system_memory;
    Xms_slider.max = system_memory;

    if (startup_data.args.jar != undefined) {
        Xmx_slider.value = startup_data.args.Xmx;
        Xmx_value.value = startup_data.args.Xmx;

        Xms_value.value = startup_data.args.Xms;
        Xms_value.value = startup_data.args.Xms;

        server_jar.value = startup_data.args.jar;
    } else {
        Xmx_slider.value = 0;
        Xmx_value.value = 0;

        Xms_value.value = 0;
        Xms_value.value = 0;

        server_jar.value = "Server jar filename";
    }



    Xmx_slider.oninput = function () {
        Xmx_value.value = this.value;
    }

    Xmx_value.oninput = function () {
        Xmx_slider.value = this.value;
    }

    Xms_slider.oninput = function () {
        Xms_value.value = this.value;
    }

    Xms_value.oninput = function () {
        Xms_slider.value = this.value;
    }





    //properties
    var ul = document.getElementById("server_properties");

    //remove all children
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (var key in data.properties) {
        var li = document.createElement("li");
        li.style.listStyleType = "none";


        //li.innerHTML = key + ': ' + data.properties[key];
        //ul.appendChild(li);


        var span = document.createElement("span");

        //due to the defer of the json file, the css file is ignored        
        span.innerHTML = key + ":";
        span.style.fontSize = "15px";

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

            input.style.border = "none";
            input.style.borderStyle = "solid";
            input.style.borderWidth = "1px";
            input.style.backgroundColor = "transparent";
            input.style.fontSize = "15px";


            span.appendChild(input);
        }

        li.style.padding = "0px";
        li.style.marginTop = "0px";


        li.appendChild(span);
        ul.appendChild(li);

    }


    hideDiv('settings_screen');
    showDiv('server_screen');


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
    temp_settings_data[active_server_id]['properties'][property] = value;

}


function saveServerProperties() {
    //save server properties to server.properties

    console.log(temp_settings_data)
    fs.writeFileSync('server_list.json', JSON.stringify(temp_settings_data, null, 4));

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
    loadServer(active_server_id);
}

function resetChanges() {

    listFiles();
    loadServer(active_server_id);

}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function startServer() {
    //create StartServer.bat file and run it
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    var server_path = data[active_server_id].path;

    var server_data = JSON.parse(fs.readFileSync(server_path + '/server.json', 'utf8'));

    var ram_min = document.getElementById('Xms_value').value;
    var ram_max = document.getElementById('Xmx_value').value;
    var server_jar = document.getElementById('server_jar').value;

    server_data.args.Xmx = ram_max;
    server_data.args.Xms = ram_min;
    server_data.args.jar = server_jar;

    fs.writeFileSync(server_path + '/server.json', JSON.stringify(server_data, null, 4));


    var output = '';
    output += 'cd /d "' + server_path + '"\n';
    output += 'java -Xmx' + document.getElementById('Xmx_value').value + 'M -Xms' + document.getElementById('Xms_value').value + 'M -jar ' + document.getElementById('server_jar').value + ' nogui\n';

    fs.writeFileSync(server_path + '/StartServer.bat', output);



    var child_process = require('child_process');

    var startpath = server_path + '/StartServer.bat';

    if (config.useWindowsTerminal) {
        child_process.exec("start wt.exe " + startpath);
    } else {
        child_process.exec("start " + startpath);
    }

   
    if (config.closeOnServerStart) {
        delay(2000).then(() => {
            window.close();
        });
    }
}