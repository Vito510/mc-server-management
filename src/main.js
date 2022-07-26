function listFiles() {
    const fs = require('fs');
    const path = require('path');

    const directoryPath = "C:/Users/Vito/Downloads";

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
        let j = {'id':count,'name': element.split('\\').pop(),'path': element,'properties': data_temp};
        data[count.toString()] = j;
        count++;
    });

    //convert data to json and save to file
    fs.writeFileSync('server_list.json', JSON.stringify(data, null, 4));

}
