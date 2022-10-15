const { table } = require('console');
const fs = require('fs');
const os = require('os');


var system_memory = os.totalmem() / 1024 / 1024;
system_memory = system_memory - system_memory % 1024;


var active_server_id = -1;
var temp_settings_data = {};

var disable_switch = false;

var player_data = {};

//startup
loadIntoBar();

//load config
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
loadTheme(config["theme"],s=true)
document.getElementById("path_input").value = config.search_path;
const java_folder = config.java_folder_path

document.getElementById("p_java_path").innerHTML = "Java folder: " + java_folder
document.getElementById("p_java_count").innerHTML = "Total java versions found: " + fs.readdirSync(java_folder).length

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    var arrow = this.previousElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
      arrow.style.transform = "rotate(180deg)";
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    arrow.style.transform = "rotate(0deg)";
    }
  });
}

alterCSS();

function alterCSS() {

    b = document.getElementById("start_server_button");
    if (config["accentStartButton"]) {
        b.style.backgroundColor = "var(--accent)"
        b.style.borderColor = "var(--accent-highlight)";
    } else {
        b.style.backgroundColor = "var(--color-3)";
        b.style.borderColor = "var(--color-2)";
    }

}

function loadTheme(theme, s=false) {
    if (!s) {
        config["theme"] = theme;
        saveConfig();
    }
    theme = config["themes"][theme]
    var r = document.querySelector(':root');

    for (const key in theme) {
        if (Object.hasOwnProperty.call(theme, key)) {
            const hex = theme[key];
            r.style.setProperty('--'+key, hex);
        }
    }
}

buildSettings()

function saveConfig() {
    //save config to config.json
    fs.writeFileSync('config.json', JSON.stringify(config, null, 4));
}

function buildSettings() {
    //Construct elements in settings
    var table = document.getElementById("settings_table");
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

    let ignore = ["search_path","java_folder_path","themes","theme"]

    for (var key in config) {

        if (ignore.includes(key)) {
            continue;
        }

        tr = document.createElement("tr");
        
        th_name = document.createElement("th");
        p = document.createElement("p");

        p.classList.add("settings_options_text");

        p.innerHTML = key;
        

        th_name.appendChild(p);
        tr.appendChild(th_name);

        th_setting = document.createElement("th");
        setting = document.createElement("input");
        setting.type = "checkbox";
        setting.checked = config[key];
        setting.id = key;
        setting.onclick = function () {
            updateSettings(this.id, this.checked);
        }

        th_setting.appendChild(setting);
        tr.appendChild(th_setting);
        

        table.appendChild(tr)

    }

    theme_select = document.getElementById("theme_select")
    
    for (var theme in config["themes"]) {
        o = document.createElement("option");
        o.innerHTML = theme;
        theme_select.append(o);
    }

    theme_select.value = config["theme"]

}

function updateSettings(key, property) {
    config[key] = property;
    saveConfig();
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
        
        button.classList.add("server_list");

        button.innerHTML = data[key].name;

        li.appendChild(button);
        ul.appendChild(li);

    }

}

function loadServer(server_id) {
    /**
    *load server details into main page
    **/

    alterCSS();

    if (disable_switch) {
        return;
    }

    if (config["instantlySaveServerProperties"]) {
        hideDiv("save_properties_button")
    } else {
        showDiv("save_properties_button")
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
        document.getElementById("server_icon").src = data.path + '/server-icon.png?t=' + new Date().getTime();
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

            img.classList.add("server_images")

            //on click
            img.onclick = function () {
                openImage(this.src);
            }

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

        Xms_slider.value = startup_data.args.Xms;
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

    Xmx_slider.style.backgroundSize = (Xmx_slider.value - Xmx_slider.min) * 100 / (Xmx_slider.max - Xmx_slider.min) + '% 100%'
    Xms_slider.style.backgroundSize = (Xms_slider.value - Xms_slider.min) * 100 / (Xms_slider.max - Xms_slider.min) + '% 100%'




    Xmx_slider.oninput = function () {
        Xmx_value.value = this.value;
        this.style.backgroundSize = (this.value - this.min) * 100 / (this.max - this.min) + '% 100%'
        
    }

    Xmx_value.oninput = function () {
        Xmx_slider.value = this.value;
        Xmx_slider.style.backgroundSize = (this.value - this.min) * 100 / (this.max - this.min) + '% 100%'
    }

    Xms_slider.oninput = function () {
        Xms_value.value = this.value;
        this.style.backgroundSize = (this.value - this.min) * 100 / (this.max - this.min) + '% 100%'

    }

    Xms_value.oninput = function () {
        Xms_slider.value = this.value;
        Xms_slider.style.backgroundSize = (this.value - this.min) * 100 / (this.max - this.min) + '% 100%'

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
    document.getElementById("properties_search").value = "";
    propertiesSearch("");
    var table = document.getElementById("server_properties");

    var dropdown_properties = {
        "gamemode": ["survival", "creative", "adventure", "spectator"],
        "difficulty": ["peaceful", "easy", "normal", "hard"],
    };

    //remove all children
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }

    for (var key in data.properties) {
        var tr = document.createElement("tr");
        
        var th_name = document.createElement("th");
        var th_setting = document.createElement("th");

        var p = document.createElement("p");
        
        p.innerHTML = key + ":";
        
        p.classList.add("server_properties")


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
            th_setting.appendChild(select);

        } else if (typeof data.properties[key] == 'boolean') {
            //if property is a boolean, create a checkbox
            var checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", key);
            checkbox.setAttribute("onclick", "updateProperty(this.id, this.checked)");
            checkbox.checked = data.properties[key];

            th_setting.appendChild(checkbox);
        } else {
            var input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("id", key);
            input.setAttribute("value", data.properties[key]);
            input.setAttribute("onchange", "updateProperty(this.id, this.value)");

            input.classList.add("server_propreties")

            th_setting.appendChild(input);
        }

        th_name.appendChild(p)

        tr.appendChild(th_name);
        tr.appendChild(th_setting);


        table.append(tr);

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

function openDownloadPage(s, id) {

    if (s == "") {
        return;
    }

    var child_process = require('child_process');
    base_url = "https://mcversions.net/download/"
    child_process.exec("start "+base_url+s)

    x = document.getElementById(id);
    x.value = "";
}

function changeServerIcon(id) {
    path = document.getElementById(id).files[0].path;

    path = path.split("\\");

    for (let i = 0; i < path.length; i++) {
        if (path[i].indexOf(" ") != -1) {
            path[i] = '"'+path[i]+'"';
        } 
    }

    path = path.join("/");

    var ffmpeg = require('ffmpeg');
    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    out = data[active_server_id].path
    out = out.replace("/","\\")


    var process = new ffmpeg(path);

    process.then(function (image) {


        // image.setVideoSize("64x64");
        image.addCommand("-vf scale=64:64")
        image.addCommand("-y")
        image.save('"'+out+'\\server-icon.png"')
    });

    data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));

    document.getElementById("server_icon").src = path;

}


function showSettings() {

    if (disable_switch) {
        return;
    }

    active_server_id = -1;

    hideDiv('server_screen');
    showDiv('settings_screen');
}

function updateProperty(property, value) {
    //update property in server_list.json
    temp_settings_data[active_server_id]['properties'][property] = value;
    if (config["instantlySaveServerProperties"] == false) {
        saveServerProperties();
    }

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


    fs.writeFileSync(server_path + '\\StartServer.bat', output + "\nexit");

    var child_process = require('child_process');

    //handling for spaces in paths (for cmd)
    server_path = server_path.split("\\");

    for (let i = 0; i < server_path.length; i++) {
        if (server_path[i].indexOf(" ") != -1) {
            server_path[i] = '"'+server_path[i]+'"';
        } 
    }

    server_path = server_path.join("/");


    var startpath = server_path + '/StartServer.bat';
    console.log(startpath);

    if (config.useWindowsTerminal) {
        child_process.exec('start wt.exe ' + startpath);
    } else {
        child_process.exec('start ' + startpath);
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

    var container = document.getElementById("server_images")

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

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

    var table = document.getElementById("player_list");

    for (var i = table.children.length - 1; i > 0; i--) {
        table.removeChild(table.children[i]);
    }

    player_data = {};

    var data = JSON.parse(fs.readFileSync('server_list.json', 'utf8'));
    var server_path = data[active_server_id].path;

    var ops = JSON.parse(fs.readFileSync(server_path+"/ops.json"))
    var whitelist = JSON.parse(fs.readFileSync(server_path+"/whitelist.json"))
    var banned_players = JSON.parse(fs.readFileSync(server_path+"/banned-players.json"))

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

            j = {
                    "name": answer.username,
                    "avatar": answer.avatar,
                    "op": 0,
                    "whitelisted": false,
                    "banned": false
                }

            player_data[id] = j;


            fs.writeFileSync(cache_path, JSON.stringify(cache, null, 4));


        })();


    }

    ops.forEach(item => {
        id = item['uuid']
        if (uuid.includes(id) && player_data.hasOwnProperty(id)) {
            player_data[id]['op'] = item['level']
        }
    });

    whitelist.forEach(item => {
        id = item['uuid']
        if (uuid.includes(id) && player_data.hasOwnProperty(id)) {
            player_data[id]['whitelisted'] = true;
        }
    });

    banned_players.forEach(item => {
        id = item['uuid']
        if (uuid.includes(id) && player_data.hasOwnProperty(id)) {
            player_data[id]['banned'] = true;
        }
    });



    for(player in player_data) {

        uuid = player
        player = player_data[player]

        tr = document.createElement("tr");

        th_img = document.createElement("th");
        img = document.createElement("img");

        img.src = player['avatar'];
        img.classList.add("player_info");

        th_img.append(img);


        th_name = document.createElement("th");
        p = document.createElement("p");

        p.classList.add("player_info");

        p.innerHTML = player['name'];
        th_name.append(p);

        tr.append(th_img);
        tr.append(th_name);

        //add op level
        select = document.createElement("select");
        info = ["Player is not op.","Player can bypass spawn protection.","Player can use cheat commands and command blocks.","Player can use multiplayer management commands.","Player can use all commands including server management commands"]
        
        for(i = 0; i <= 4; i++) {
            option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            option.title = info[i];
            select.append(option);

        }

        select.value = player["op"];
        select.id = uuid
        select.setAttribute("onchange", 'updatePlayerData(this.id,"op",parseInt(this.value))');


        tr.append(select);

        table.append(tr);

        a = ["whitelisted","banned"];

        for(i = 0; i < 2; i++) {
            th_check = document.createElement("th");
            input = document.createElement("input");

            input.type = "checkbox";
            input.checked = player[a[i]];
            input.id = uuid+"//"+a[i];

            input.setAttribute("onchange", 'updatePlayerData(this.id.split("//")[0],this.id.split("//")[1], this.checked)');


            th_check.append(input);
            tr.append(th_check);
        }


    }

}

function getDateTime() {
    var date_ob = new Date();
    var day = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
        
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var seconds = date_ob.getSeconds();
    
    var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return dateTime;
}

function updatePlayerData(uuid, key, value) {
    //update local player data properties
    player_data[uuid][key] = value;
    SavePlayerData();
}

function propertiesSearch(search) {
    //hide elements that do not contain search
    children = document.getElementById("server_properties").children;

    for (let index = 0; index < children.length; index++) {
        const element = children[index];
        const text = element.firstChild.firstChild.innerHTML;
        
        if (text.search(search) == -1) {
            element.style.display = "none";
        } else {
            element.style.display = "";
        }
        
    }
}

function SavePlayerData() {
    ops = []
    whitelist = []
    banned = []

    for (const key in player_data) {
        if (Object.hasOwnProperty.call(player_data, key)) {
            const player = player_data[key];
            if (player["op"] > 0) {
                ops.push({
                    "uuid": key,
                    "name": player["name"],
                    "level": player["op"],
                    "bypassesPlayerLimit": false
                })
            }

            if (player["banned"] == true) {
                banned.push({
                    "uuid": key,
                    "name": player["name"],
                    "created": getDateTime(),
                    "source": "mc-server-management",
                    "expires": "forever",
                    "reason": "Banned by an operator."
                })
            }

            if (player["whitelisted"] == true) {
                whitelist.push({
                    "uuid": key,
                    "name": player["name"]
                })
            }
        }
    }

    //write

    var server_path = JSON.parse(fs.readFileSync('server_list.json', 'utf8'))[active_server_id].path;

    fs.writeFileSync(server_path+"/ops.json", JSON.stringify(ops, null, 4));
    fs.writeFileSync(server_path+"/banned-players.json", JSON.stringify(banned, null, 4));
    fs.writeFileSync(server_path+"/whitelist.json", JSON.stringify(whitelist, null, 4));




    console.log(ops)

}