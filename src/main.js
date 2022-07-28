const fs = require('fs');
const os = require('os');


const system_memory = os.totalmem() / 1024 / 1024;

var active_server_id = -1;
var temp_settings_data = {};

var disable_switch = false;


//startup
loadIntoBar();

//load config
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
document.getElementById("path_input").value = config.search_path;
const java_folder = config.java_folder_path

document.getElementById("p_java_path").innerHTML = "Java folder: " + java_folder
document.getElementById("p_java_count").innerHTML = "Total java versions found: " + fs.readdirSync(java_folder).length

function saveConfig() {
    //save config to config.json
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
}


function listFiles() {
    //find all server folders and parse their properties
    const path = require('path');

    const directoryPath = document.getElementById("path_input").value.split(',');
    console.log(directoryPath);
    //save path to config

    try {
        config.search_path = document.getElementById("path_input").value;
        saveConfig();
    } catch (error) {
        console.log('unable to save path');
    }


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

        //check if server.json exists
        if (fs.existsSync(element + '/server.json')) {
            server_data = JSON.parse(fs.readFileSync(element + '/server.json', 'utf8'));
            server_images = server_data.images;
            server_args = server_data.args;
        } else {
            fs.writeFileSync(element + '/server.json', JSON.stringify({ 'args': {}, 'images': [] }, null, 4));
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
        let j = { 'id': count, 'name': element.split('\\').pop(), 'path': element, 'properties': data_temp };
        data[count.toString()] = j;
        count++;
    });

    //convert data to json and save to file
    fs.writeFileSync('server_list.json', JSON.stringify(data, null, 4));

    var temp_settings_data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    loadIntoBar();

}

function loadIntoBar() {
    //load server_list.json into the scrollbar
    var ul = document.getElementById("serverlist");

    //remove all children, except the first one
    for (var i = ul.children.length - 1; i > 0; i--) {
        ul.removeChild(ul.children[i]);
    }

    try {
        var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    } catch (error) {
        console.log('unable to load server list');
        return;
    }

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

    if (disable_switch || active_server_id == server_id) {
        return;
    }

    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var startup_data = JSON.parse(fs.readFileSync(data[server_id].path + '/server.json', 'utf8'));


    document.getElementById("input_server_images").files = undefined;

    temp_settings_data = data;

    data = data[server_id];
    active_server_id = server_id;

    //general info

    //check if server-icon exists
    if (fs.existsSync(data.path + '/server-icon.png')) {
        document.getElementById("server_icon").src = data.path + '/server-icon.png';
        document.getElementById("server_icon").title = '';
    } else {
        document.getElementById("server_icon").src = 'https://via.placeholder.com/64';
        document.getElementById("server_icon").title = 'add server-icon.png to the server folder (must be 64x64)';
    }

    document.getElementById('server_name').innerHTML = data.name;
    document.getElementById('server_path').innerHTML = data.path;
    document.getElementById('server_motd').innerHTML = data.properties.motd;


    //images

    var image_input = document.getElementById('input_server_images');
    var images;

    image_input.oninput = function () {
        //update images
        var images_temp = image_input.files;
        image_input.files = undefined;

        //for each image

        for (var i = 0; i < images_temp.length; i++) {
            if (i > 3) { break; }
            images.push(images_temp[i]['path']);
        }

        //save images to server.json
        startup_data.images = images;
        fs.writeFileSync(data.path + '/server.json', JSON.stringify(startup_data, null, 4));
        loadServer(active_server_id);
    }

    if (startup_data.images != undefined) {
        images = startup_data.images;
    }

    //limit number of images to 3
    if (images.length > 3) {
        //get last 3 images
        images = images.slice(images.length - 3, images.length);
    }

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
            //on click
            img.onclick = function () {
                openImage(this.src);
            }
            img.style.cursor = 'pointer';
            image_container.appendChild(img);
        });
    }

    //startup properties

    var Xmx_slider = document.getElementById('Xmx_slider');
    var Xmx_value = document.getElementById('Xmx_value');
    var Xms_slider = document.getElementById('Xms_slider');
    var Xms_value = document.getElementById('Xms_value');

    var server_jar = document.getElementById('server_jar');

    //find all jar files in the server folder

    while (server_jar.firstChild) {
        server_jar.removeChild(server_jar.firstChild);
    }

    fs.readdirSync(data.path).forEach(element => {
        if (element.endsWith('.jar') && !element.includes('install')) {
            var option = document.createElement("option");
            option.value = element;
            option.innerHTML = element;
            server_jar.appendChild(option);
        }
    });

    //find all java versions

    var java_version = document.getElementById('java_version');

    while (java_version.firstChild) {
        java_version.removeChild(java_version.firstChild);
    }

    var option = document.createElement("option");
    option.value = "java";
    option.innerHTML = "Use system default";
    java_version.appendChild(option)

    fs.readdirSync(java_folder).forEach(element => {
        option = document.createElement("option");
        option.value = '"' + java_folder + '\\' + element + '\\bin\\java.exe"';
        option.innerHTML = element;
        java_version.appendChild(option);
    }
    );


    //ram slider

    Xmx_slider.max = system_memory;
    Xms_slider.max = system_memory;
    Xms_value.max = system_memory;
    Xmx_value.max = system_memory;

    Xmx_value.min = 0;
    Xms_value.min = 0;

    if (startup_data.args.jar != undefined) {
        Xmx_slider.value = startup_data.args.Xmx;
        Xmx_value.value = startup_data.args.Xmx;

        Xms_value.value = startup_data.args.Xms;
        Xms_value.value = startup_data.args.Xms;

        server_jar.value = startup_data.args.jar;
        java_version.value = startup_data.args.java;
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

    //server gui checkmark

    var gui = document.getElementById('gui')

    if (startup_data.args.gui != undefined) {
        gui.checked = startup_data.args.gui
    } else {
        gui.checked = false
    }

    //world

    document.getElementById('world_name').innerHTML = 'World name: ' + data.properties['level-name'];

    //check if world exists
    if (fs.existsSync(data.path + '\\' + data.properties['level-name'])) {
        //get folder size
        var size = getFolderSize(data.path + '\\' + data.properties['level-name']);
        document.getElementById('world_size').innerHTML = 'World size: ' + (size / 1024 / 1024).toFixed(2) + ' MB';
    } else {
        document.getElementById('world_size').innerHTML = 'World size: N/A';
    }

    //count amount of .dat files in world/playerdata

    var playerdata_files = 0;
    var player_uuid = [];

    fs.readdirSync(data.path + '\\' + data.properties['level-name'] + '\\playerdata').forEach(element => {
        if (element.endsWith('.dat')) {
            playerdata_files++;
            player_uuid.push(element.replace('.dat', ''));
        }
    }
    );

    document.getElementById('player_data_count').innerHTML = 'Total player count: ' + playerdata_files;




    //properties
    var ul = document.getElementById("server_properties");

    var dropdown_properties = {
        "gamemode": ["survival", "creative", "adventure", "spectator"],
        "difficulty": ["peaceful", "easy", "normal", "hard"],
    };

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

        //check if the property is a dropdown
        if (dropdown_properties[key] != undefined) {
            var select = document.createElement("select");
            select.id = key;
            select.setAttribute("onchange", "updateProperty(this.id, this.value)");
            for (var i = 0; i < dropdown_properties[key].length; i++) {
                var option = document.createElement("option");
                option.value = dropdown_properties[key][i];
                option.innerHTML = dropdown_properties[key][i];
                select.appendChild(option);
            }
            select.value = data.properties[key];
            span.appendChild(select);

        } else if (typeof data.properties[key] == 'boolean') {
            //if property is a boolean, create a checkbox
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

    //player list
    loadPlayerData(player_uuid);


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

function toggleDiv(div_id) {
    var x = document.getElementById(div_id);
    if (x.style.display == "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}


function showSettings() {

    if (disable_switch) {
        return;
    }

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

    //check if jar is defined
    var server_jar = document.getElementById('server_jar');
    if (server_jar.value == "Server jar filename") {
        //dialog.showErrorBox("Error", "Please select a server jar file");
        console.log("Please select a server jar file");
        return;
    }


    //create StartServer.bat file and run it
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    var server_path = data[active_server_id].path;

    var server_data = JSON.parse(fs.readFileSync(server_path + '/server.json', 'utf8'));

    var ram_min = document.getElementById('Xms_value').value;
    var ram_max = document.getElementById('Xmx_value').value;
    var server_jar = document.getElementById('server_jar').value;
    var server_java = document.getElementById('java_version').value;
    var gui = document.getElementById('gui').checked;

    server_data.args.Xmx = ram_max;
    server_data.args.Xms = ram_min;
    server_data.args.jar = server_jar;
    server_data.args.java = server_java;
    server_data.args.gui = gui;

    fs.writeFileSync(server_path + '/server.json', JSON.stringify(server_data, null, 4));


    var output = '';

    var nogui = '';

    if (!gui) {
        nogui = ' nogui';
    }

    output += 'cd /d "' + server_path + '"\n';
    output += server_java + ' -Xmx' + ram_max + 'M -Xms' + ram_min + 'M -jar ' + server_jar + nogui + '\n';

    fs.writeFileSync(server_path + '\\StartServer.bat', output);



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

function removeServerList() {
    //remove server_list.json
    fs.unlinkSync('server_list.json');
    loadIntoBar();
}

function clearImages() {
    //remove server_list.json
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var server_data = JSON.parse(fs.readFileSync(data[active_server_id].path + '/server.json', 'utf8'));
    server_data.images = [];
    fs.writeFileSync(data[active_server_id].path + '/server.json', JSON.stringify(server_data, null, 4));
    loadServer(active_server_id);
}

function openFolder() {
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var server_path = data[active_server_id].path;
    var child_process = require('child_process');
    child_process.exec("explorer " + server_path);
}

function openImage(src) {
    src = src.replace('file:///', '');
    //replace all %20 with spaces
    src = src.replace(/%20/g, ' ');
    var child_process = require('child_process');
    child_process.exec('"' + src + '"');
}

function getFolderSize(folder) {
    var size = 0;
    var files = fs.readdirSync(folder);
    for (var i = 0; i < files.length; i++) {
        var file = folder + '\\' + files[i];
        if (fs.statSync(file).isDirectory()) size += getFolderSize(file);
        else size += fs.statSync(file).size;
    }
    return size;
}

function backupWorld() {
    //create a backup folder if it doesn't exist
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var server_path = data[active_server_id].path;
    var backup_path = server_path + '\\backup';

    if (!fs.existsSync(backup_path)) {
        fs.mkdirSync(backup_path);
    }

    var status = document.getElementById('backup_status');

    status.innerHTML = 'Backing up world, please wait...';

    disable_switch = true;

    status.style.color = 'yellow';
    //create a backup folder if it doesn't exist
    var archiver = require('archiver');


    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + "-" + today.getMinutes();
    var dateTime = date + '-' + time;

    var out_name = data[active_server_id].properties['level-name'] + '_' + dateTime + '.zip';

    var output = fs.createWriteStream(backup_path + '\\' + out_name);
    var archive = archiver('zip', {
        gzip: true
    });

    archive.pipe(output);

    archive.directory(server_path + '\\world', false);
    archive.finalize();

    output.on('close', function () {
        console.log('Done backing up');
        status.innerHTML = 'Backup complete';
        status.style.color = 'lightgreen';
        disable_switch = false;
        delay(2000).then(() => {
            status.innerHTML = '';
        });
    });


}

function loadPlayerData(uuid) {
    var ul = document.getElementById("player_list");

    //remove all children
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    //check if cache exists
    var cache_path = './cache.json';
    if (fs.existsSync(cache_path)) {
        var cache = JSON.parse(fs.readFileSync(cache_path, 'utf8'));
    } else {
        var cache = {};
    }

    for (var i = 0; i < uuid.length; i++) {

        (async () => {
            var answer;

            var id = uuid[i];

            if (cache[id]) {
                answer = cache[id];

                if (answer == 'error') {
                    return;
                }

            } else {

                answer;
                const res = await fetch('https://playerdb.co/api/player/minecraft/' + uuid[i]);
                answer = await res.json();


                if (!answer.success) {
                    cache[id] = 'error';
                    fs.writeFileSync(cache_path, JSON.stringify(cache, null, 4));
                    return;
                }

                answer = answer.data.player;
                cache[id] = answer;

            }


            fs.writeFileSync(cache_path, JSON.stringify(cache, null, 4));

            var li = document.createElement("li");
            var img = document.createElement("img");
            var span = document.createElement("span");

            li.style.listStyleType = "none";
            span.innerHTML = answer.username;

            img.style.width = "16px";
            img.style.height = "16px";
            img.style.marginRight = "5px";
            img.src = answer.avatar;

            li.appendChild(img);
            li.appendChild(span);

            ul.appendChild(li);

        })();

    }
}